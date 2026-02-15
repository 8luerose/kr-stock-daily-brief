.PHONY: up down rebuild logs ps backend-logs mysql-logs frontend-logs backend-test backend-e2e health

DOCKER_SOCK ?= /var/run/docker.sock

up:
	docker compose up -d --build

down:
	docker compose down

rebuild:
	docker compose build --no-cache

ps:
	docker compose ps

logs:
	docker compose logs -f --tail=200

backend-logs:
	docker compose logs -f --tail=200 backend

frontend-logs:
	docker compose logs -f --tail=200 frontend

mysql-logs:
	docker compose logs -f --tail=200 mysql

health:
	@echo "Backend: http://localhost:$${BACKEND_PORT:-8080}/actuator/health"
	@echo "Frontend: http://localhost:$${FRONTEND_PORT:-5173}"

# Runs API tests against a disposable MySQL Testcontainer (inside the Gradle container).
backend-test:
	docker run --rm -t \
		-v "$$PWD/backend:/workspace" \
		-v "$(DOCKER_SOCK):/var/run/docker.sock" \
		-w /workspace \
		-e DOCKER_HOST=unix:///var/run/docker.sock \
		gradle:8.7-jdk17 \
		gradle test
