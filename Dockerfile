FROM python:3.13-slim
WORKDIR /app
COPY backend/ /app/
RUN pip install django==5.1 djangorestframework djangorestframework-simplejwt pymupdf pgvector psycopg2-binary google-genai django-cors-headers channels daphne python-dotenv
# Ensure migrate runs on startup or let compose handle it.
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
