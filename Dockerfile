FROM python:3.8-slim

WORKDIR /app

COPY . .

RUN pip install --upgrade pip
RUN pip install -r app/requirements.txt

CMD ["sh", "start.sh"]
