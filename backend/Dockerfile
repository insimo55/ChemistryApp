# Используем легковесный, но стабильный образ
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Устанавливаем зависимости psycopg2
# RUN apt-get update && apt-get install -y postgresql-client

COPY requirements.txt /app/
# Используем --no-cache-dir для уменьшения размера образа
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/