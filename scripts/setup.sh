#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — add your OPENROUTER_API_KEY before starting the chat features."
fi

pnpm install

docker compose up -d --wait

pnpm db:generate
pnpm db:push
pnpm db:ensure

echo
echo "Setup complete. Run 'pnpm dev' to start api, worker, and web."
