FROM python:3.10-alpine 

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Устанавливаем зависимости для сборки (удалятся после установки)
RUN apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копируем наш новый скрипт
COPY entrypoint.sh /app/entrypoint.sh
# Делаем его исполняемым
RUN chmod +x /app/entrypoint.sh

# Удаляем зависимости для сборки
RUN apk del .build-deps

COPY . /app/

# Указываем Docker запускать наш скрипт при старте контейнера
ENTRYPOINT ["/app/entrypoint.sh"]