# syntax=docker/dockerfile:1

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install runtime dependencies for XGBoost/OpenMP and curl for healthcheck probing
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Establish non-root user and application directory
RUN groupadd -g 10001 mluser && \
    useradd -u 10001 -g mluser -m -s /bin/bash mluser

WORKDIR /app

# Cache Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and allocate model storage with non-root ownership
COPY . /app/
RUN mkdir -p /app/models && \
    chown -R mluser:mluser /app

USER mluser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

