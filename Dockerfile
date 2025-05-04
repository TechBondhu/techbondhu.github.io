FROM python:3.9-slim-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libc6-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY rasa/requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir rasa==3.6.21 rasa-sdk==3.6.2
RUN pip install --no-cache-dir -r requirements.txt

COPY rasa/ .
EXPOSE 5005 5055
CMD ["sh", "-c", "rasa run --enable-api --cors '*' --port 5005 --model models/20250501-204026-online-codec.tar.gz & rasa run actions --actions actions --port 5055"]
