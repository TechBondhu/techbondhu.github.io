# Use official Python image
FROM python:3.9-slim-bullseye

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

# Upgrade pip and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Expose ports for Rasa API and Action Server
EXPOSE 5005

# Start both Rasa API and Action Server
CMD ["sh", "-c", "rasa run --enable-api --cors '*' --port 5005 --model models/20250501-204026-online-codec.tar.gz & rasa run actions --actions actions --port 5055 & wait"]
