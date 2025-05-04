# Use official Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libc6-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY rasa/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Rasa project files
COPY rasa/ .

# Expose Rasa and Action Server ports
EXPOSE 5005 5055

# Start both Rasa and Action Server with specific model
CMD ["sh", "-c", "rasa run --enable-api --cors '*' --port 5005 --model models/20250501-204026-online-codec.tar.gz & rasa run actions --actions actions --port 5055"]
