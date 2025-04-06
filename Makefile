.PHONY: build up down restart logs clean install start test

# Docker commands
build:
	docker-compose build

up:
	docker-compose up

down:
	docker-compose down

restart:
	docker-compose down
	docker-compose up

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

# Development commands without Docker
install:
	npm install

start:
	npm start

test:
	npm test

# Help command
help:
	@echo "Available commands:"
	@echo "  make build     - Build Docker containers"
	@echo "  make up        - Start Docker containers"
	@echo "  make down      - Stop Docker containers"
	@echo "  make restart   - Restart Docker containers"
	@echo "  make logs      - View Docker container logs"
	@echo "  make clean     - Clean Docker system and volumes"
	@echo "  make install   - Install npm dependencies locally"
	@echo "  make start     - Start the application locally"
	@echo "  make test      - Run tests locally" 