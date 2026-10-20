# worlddigital.ai tools API — FastAPI + MongoDB, runs on Google Cloud Run.
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /srv
COPY pyproject.toml ./
RUN pip install "fastapi>=0.115" "uvicorn[standard]>=0.30" "httpx>=0.27" "pymongo>=4.8" "openpyxl>=3.1" "python-docx>=1.1" "reportlab>=4.2"
COPY app ./app
RUN useradd -r -u 10001 api && chown -R api /srv
USER api
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips='*'"]
