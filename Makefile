include .env

up:
	docker compose up --build -d

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=200

pull-model:
	docker compose exec ollama ollama pull $${OLLAMA_MODEL:-qwen2:7b}

ps:
	docker compose ps
