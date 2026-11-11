"""WorldDigital Intelligent Execution Engine (WD-IEE): runs a product as a plan of tasks.

A plan is written once, in code, and checked when it is built (unique task names, every dependency exists, no
cycles), so a broken plan fails at import time and never in front of a customer. At run time every task whose
dependencies are finished starts at once, on a small thread pool; a task that needs earlier results waits for them.

  plan = Plan("keywords", [
      Task("site", read),                                  # these two do not depend on each other,
      Task("site_keywords", lookup, optional=True, default=[]),   # so they run at the same time
      Task("pick", choose, needs=("site", "site_keywords")),
  ])
  run = execute(plan, {"url": ...})
  run.results["pick"]

A task function receives one dict: the request under "input" plus the result of each task it needs, by name.

What each part does:
  - optional tasks: a failure is recorded and the task's default is used; a required task's failure stops the run
    and its original error is raised, exactly as if the function had been called directly.
  - retries: only for the error types a task names, waiting 0.5 s, 1 s, 2 s ... up to 8 s with jitter.
  - cache: a task with cache_ttl is stored under a key made from the plan, the task, the task's version and the
    inputs it says matter (cache_key). Changing the version or the inputs makes a new key, so stale results are
    never served. Policy "if_needed" (default) reads and writes, "always" recomputes and overwrites, "never" skips
    the cache. Identical cacheable work already in flight in this process is shared instead of repeated.
  - workers=1 runs the same plan one task at a time, in plan order: the honest baseline for measuring what
    running in parallel saves.
  - every run produces a record (per task: wait, duration, attempts, status, error) handed to the sink.

There is no per-task kill switch: a thread cannot be stopped from outside, so each task's own HTTP timeouts bound it.
"""
from __future__ import annotations

import hashlib
import json
import random
import threading
import time
import uuid
from concurrent.futures import FIRST_COMPLETED, Future, ThreadPoolExecutor, wait
from dataclasses import dataclass, field
from typing import Any, Callable

POLICIES = ("if_needed", "always", "never")


class PlanError(ValueError):
    """The plan itself is wrong (found when it is built, not when it runs)."""


@dataclass(frozen=True)
class Task:
    name: str
    fn: Callable[[dict], Any]
    needs: tuple[str, ...] = ()
    optional: bool = False
    default: Any = None
    retries: int = 0
    retry_on: tuple[type[BaseException], ...] = ()
    cache_ttl: int = 0                                   # seconds; 0 = never cached
    cache_key: Callable[[dict], Any] | None = None       # the part of the context that identifies the result
    version: int = 1                                     # raise it when the task's logic changes


class Plan:
    def __init__(self, name: str, tasks: list[Task]):
        self.name, self.tasks = name, list(tasks)
        names = [t.name for t in self.tasks]
        if len(set(names)) != len(names):
            raise PlanError(f"{name}: duplicate task name")
        if "input" in names:
            raise PlanError(f'{name}: "input" is reserved for the request')
        known = set(names)
        for t in self.tasks:
            missing = [n for n in t.needs if n not in known]
            if missing:
                raise PlanError(f"{name}: task {t.name} needs unknown {missing}")
            if t.cache_ttl and not t.cache_key:
                raise PlanError(f"{name}: task {t.name} is cached but has no cache_key")
        # levels: tasks in the same level have no dependency on each other
        self.levels: list[list[str]] = []
        done: set[str] = set()
        left = list(self.tasks)
        while left:
            ready = [t for t in left if all(n in done for n in t.needs)]
            if not ready:
                raise PlanError(f"{name}: dependency cycle among {[t.name for t in left]}")
            self.levels.append([t.name for t in ready])
            done.update(t.name for t in ready)
            left = [t for t in left if t.name not in done]


@dataclass
class Run:
    plan: str
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:16])
    workers: int = 0
    ms: int = 0
    ok: bool = True
    results: dict = field(default_factory=dict)
    tasks: list[dict] = field(default_factory=list)

    def record(self) -> dict:
        """What is stored: timings and outcomes only, never task inputs or results."""
        return {"plan": self.plan, "run": self.id, "workers": self.workers, "ms": self.ms, "ok": self.ok,
                "task_ms": sum(t["ms"] for t in self.tasks), "tasks": self.tasks}


class MemoryCache:
    """Process-local cache (tests, and the default when no shared cache is set)."""

    def __init__(self):
        self._d: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str):
        with self._lock:
            hit = self._d.get(key)
            if hit and hit[0] > time.time():
                return True, hit[1]
            self._d.pop(key, None)
            return False, None

    def set(self, key: str, value, ttl: int) -> None:
        with self._lock:
            self._d[key] = (time.time() + ttl, value)


_sink: Callable[[dict], None] | None = None
_cache = None
_inflight: dict[str, Future] = {}
_inflight_lock = threading.Lock()


def set_sink(fn) -> None:
    """main.py stores run records in MongoDB through this. A failing sink never breaks a run."""
    global _sink
    _sink = fn


def set_cache(cache) -> None:
    """main.py supplies a MongoDB-backed cache (get(key) -> (hit, value); set(key, value, ttl))."""
    global _cache
    _cache = cache


def cache_key(plan: str, task: Task, ctx: dict) -> str:
    ident = json.dumps([plan, task.name, task.version, task.cache_key(ctx)], sort_keys=True, default=str)
    return hashlib.sha256(ident.encode()).hexdigest()


def _delay(attempt: int) -> float:
    return min(0.5 * 2 ** attempt, 8.0) * (1 - 0.25 * random.random())


def _attempt(task: Task, ctx: dict, rec: dict, sleep) -> Any:
    for attempt in range(task.retries + 1):
        rec["attempts"] = attempt + 1
        try:
            return task.fn(ctx)
        except task.retry_on or ():
            if attempt >= task.retries:
                raise
            sleep(_delay(attempt))
    raise RuntimeError("unreachable")


def _run_task(plan: str, task: Task, ctx: dict, ready_at: float, cache, policy: str, sleep) -> tuple[Any, dict]:
    t0 = time.perf_counter()
    rec = {"task": task.name, "wait_ms": round((t0 - ready_at) * 1000), "ms": 0, "attempts": 0, "status": "ok"}
    key = cache_key(plan, task, ctx) if task.cache_ttl and cache is not None and policy != "never" else None
    owner, shared = False, None
    try:
        if key and policy == "if_needed":
            try:
                hit, value = cache.get(key)
            except Exception as e:  # noqa: BLE001  a cache that cannot be read is a miss, never a failed task
                hit, value, rec["cache_error"] = False, None, type(e).__name__
            if hit:
                rec["status"] = "cached"
                return value, rec
        if key:
            with _inflight_lock:
                shared = _inflight.get(key)
                if shared is None:
                    shared = _inflight[key] = Future()
                    owner = True
            if not owner:
                rec["status"] = "shared"
                return shared.result(), rec
        try:
            value = _attempt(task, ctx, rec, sleep)
        except BaseException as e:
            if owner:
                shared.set_exception(e)
            raise
        if owner:
            shared.set_result(value)
        if key:
            try:
                cache.set(key, value, task.cache_ttl)
            except Exception as e:  # noqa: BLE001  a cache that cannot store never fails the task
                rec["cache_error"] = type(e).__name__
        return value, rec
    finally:
        if owner:
            with _inflight_lock:
                _inflight.pop(key, None)
        rec["ms"] = round((time.perf_counter() - t0) * 1000)


def execute(plan: Plan, inp: dict, *, workers: int = 4, policy: str = "if_needed", cache="default",
            sink="default", sleep=time.sleep) -> Run:
    if policy not in POLICIES:
        raise ValueError(f"policy must be one of {POLICIES}")
    cache = (_cache if _cache is not None else None) if cache == "default" else cache
    sink = _sink if sink == "default" else sink
    run = Run(plan.name, workers=max(1, workers))
    by_name = {t.name: t for t in plan.tasks}
    results: dict[str, Any] = {}
    failure: BaseException | None = None
    started = time.perf_counter()
    pending = list(plan.tasks)
    running: dict[Future, tuple[Task, float]] = {}

    def wrapped(task: Task, ctx: dict, ready_at: float):
        rec_box: dict = {"task": task.name, "wait_ms": 0, "ms": 0, "attempts": 0, "status": "failed"}
        try:
            value, rec = _run_task(plan.name, task, ctx, ready_at, cache, policy, sleep)
            return value, rec, None
        except BaseException as e:  # noqa: BLE001  reported to the scheduler, which decides
            rec_box.update(ms=round((time.perf_counter() - ready_at) * 1000), error=type(e).__name__)
            return None, rec_box, e

    with ThreadPoolExecutor(max_workers=run.workers, thread_name_prefix=f"wd-{plan.name}") as pool:
        while pending or running:
            if failure is None:
                for task in [t for t in pending if all(n in results for n in t.needs)]:
                    if len(running) >= run.workers:
                        break
                    pending.remove(task)
                    ctx = {"input": inp, **{n: results[n] for n in task.needs}}
                    running[pool.submit(wrapped, task, ctx, time.perf_counter())] = (task, time.perf_counter())
            if not running:
                break  # a required task failed (or nothing can start): stop handing out work
            for fut in wait(running, return_when=FIRST_COMPLETED).done:
                task, _ = running.pop(fut)
                value, rec, err = fut.result()
                if err is None:
                    results[task.name] = value
                elif task.optional:
                    rec["status"] = "defaulted"
                    results[task.name] = task.default
                else:
                    failure = failure or err
                run.tasks.append(rec)

    run.tasks.extend({"task": t.name, "wait_ms": 0, "ms": 0, "attempts": 0, "status": "skipped"} for t in pending)
    order = {n: i for i, n in enumerate(by_name)}
    run.tasks.sort(key=lambda r: order[r["task"]])
    run.ms, run.ok, run.results = round((time.perf_counter() - started) * 1000), failure is None, results
    if sink:
        try:
            sink(run.record())
        except Exception:  # noqa: BLE001  observability must never break a run
            pass
    if failure is not None:
        raise failure
    return run
