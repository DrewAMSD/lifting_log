FROM python:3.12-slim

WORKDIR /api

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --exclude=*.db . .

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONBUFFERED=1

RUN chmod +x sqlite_configure.sh start_backend.sh

EXPOSE 8000

ENTRYPOINT ["./sqlite_configure.sh"]
CMD ["./start_backend.sh"]
