#!/bin/sh

# Выходим из скрипта, если любая команда завершится с ошибкой
set -e

# Ожидаем, пока база данных станет доступна
# Вместо sleep, будем использовать более надежный способ - netcat
# Сначала установим его
apk add --no-cache postgresql-client

echo "Waiting for postgres..."

# Цикл, который ждет, пока хост 'db' не начнет отвечать на порту 5432
while ! nc -z db 5432; do
  sleep 0.1
done

echo "PostgreSQL started"

# Применяем миграции базы данных
echo "Applying database migrations..."
python manage.py migrate

# Собираем статику (это можно делать здесь или отдельной командой)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Запускаем основной процесс (gunicorn)
echo "Starting gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000