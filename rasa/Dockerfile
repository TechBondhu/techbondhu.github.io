# Use official Python image

FROM python:3.8-slim

# Set working directory

WORKDIR /app

# Copy requirements and install dependencies

COPY requirements.txt . RUN pip install --no-cache-dir -r requirements.txt

# Copy Rasa project files

COPY . .

# Expose Rasa port

EXPOSE 5005

# Start Rasa server with pre-trained model

CMD \["rasa", "run", "--enable-api", "--cors", "\*", "--port", "5005", "--model", "20250501-204026-online-codec.tar.gz"\]
