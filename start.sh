#!/bin/bash
# শুধু Rasa এবং Action Server চালাও
rasa run --enable-api --cors "*" --port 5005 --model /app/models/ &
rasa run actions &
# Flask সার্ভার চালাও
cd app && python flask_app.py
