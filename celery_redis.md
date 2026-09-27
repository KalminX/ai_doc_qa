# Architecture & Local Development Guide

## The Great Refactor: Moving to Celery, RabbitMQ & Redis
Previously, the application utilized Python's native `threading` to process document vectorization in the background, combined with Django Channels' `InMemoryChannelLayer` for WebSockets.
While this worked for a simple prototype, it introduced massive instability at scale:
1. **Thread Blocking:** Native threads in Python are bottlenecked by the GIL (Global Interpreter Lock). Heavy vectorization jobs would lock up the web server's processing capacity.
2. **Memory Leaks:** `InMemoryChannelLayer` cannot share WebSocket connections across multiple web workers or load-balanced instances, leading to isolated state and lost real-time progress updates.
3. **Crash Vulnerability:** If the web server crashed during a long PDF extraction, the job was instantly lost because there was no message broker to persist the queue.

### The Solution
We decoupled the heavy lifting into an enterprise-grade message broker architecture:
* **RabbitMQ (The Message Broker):** When a user uploads a document, the Django web container instantly replies `200 OK` and pushes a message to RabbitMQ. RabbitMQ acts as a highly durable queue.
* **Celery (The Background Worker):** The new `ai_doc_qa_celery` container listens to RabbitMQ. It pulls tasks off the queue one by one, dedicating 100% of its CPU to PyMuPDF extraction and Gemini chunking without slowing down the web server.
* **Redis (The Channel Layer Layer):** We swapped `InMemoryChannelLayer` for `channels_redis`. When Celery finishes vectorizing a chunk, it pings Redis. Redis acts as a high-speed pub/sub layer, instantly broadcasting the `indexing_progress` JSON to the Django web server, which pipes it through the WebSocket to the React frontend.

---

## Local Development: Testing on Your Machine

On the production server, `ai_doc_qa` connects to `global-rabbitmq` and `global-redis` via external Docker networks. To test this stack locally on your machine, you need to spin up your own local instances of RabbitMQ and Redis alongside the app.

### 1. Create a Local Override Compose File
Create a new file named `docker-compose.local.yml` in the root directory (do not commit this to production). This file will inject local RabbitMQ and Redis containers into your stack:

```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: local_rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

  redis:
    image: redis:alpine
    container_name: local_redis
    ports:
      - "6379:6379"

  backend:
    depends_on:
      - rabbitmq
      - redis
    networks:
      - default

  celery_worker:
    depends_on:
      - rabbitmq
      - redis
    networks:
      - default

networks:
  default:
    driver: bridge
```

### 2. Update Your Local `.env` File
In your local `backend/.env` file, override the production broker URLs to point to your new local containers instead of the global server instances:

```env
# Local RabbitMQ connection
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//

# Local Redis connection for Django Channels WebSockets
REDIS_URL=redis://redis:6379/4

# Optional: Add localhost for testing
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Spin Up the Local Stack
Instead of just running the default compose file, chain them together so Docker merges your local overrides:

```bash
# Build the containers
docker compose -f docker-compose.yml -f docker-compose.local.yml build

# Start the stack (Web, Celery, Redis, RabbitMQ)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

### 4. Verify Local Execution
- **Web App:** http://localhost:8000
- **RabbitMQ Dashboard:** http://localhost:15672 (Login: `guest` / `guest`)
- Upload a PDF locally. You should see the task enqueue in the RabbitMQ dashboard, process in the Celery worker (`docker logs ai_doc_qa_celery -f`), and stream progress via the local Redis instance back to your React app.
