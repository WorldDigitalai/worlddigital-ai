# worlddigital.ai tools API — FastAPI + MongoDB, runs on Google Cloud Run.
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /srv
# ffmpeg: blog videos (voiceover + music mix, H.264 encode)
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
# Exactly the versions the tests ran with (uv.lock), not the newest ones on PyPI.
COPY requirements.lock ./
RUN pip install -r requirements.lock
COPY app ./app
RUN useradd -r -u 10001 api && chown -R api /srv
USER api
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips='*'"]
