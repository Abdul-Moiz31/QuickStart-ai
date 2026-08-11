# QuickStart AI

Production chatbot platform monorepo — multi-project credentials, hybrid + HyDE agentic RAG, Redis rate limits/cache/queues, Postgres + pgvector knowledge, MongoDB chats, embeddable React & vanilla widgets.

## Structure

```
apps/
  web/       Next.js marketing + dashboard
  api/       Fastify API (auth, projects, chat, knowledge, eval)
  worker/    BullMQ ingest/embed worker
packages/
  db/            Prisma (Postgres) + Mongoose (Mongo)
  rag/           chunking, embeddings, hybrid+HyDE, agent tools, cache
  eval/          golden-set metrics CLI
  shared/        zod schemas, errors, constants
  widget-core/   shared widget client
  widget-react/  <ChatBot clientId="..." />
  widget-vanilla/ CDN IIFE for HTML/CSS/JS sites
_legacy/         cloned QuickStart repos (reference only)
```

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm docker:up
# Host ports (remapped if local 5432/6379 are busy):
#   Postgres 5433 → container 5432
#   Redis    6380 → container 6379
#   Mongo    27017
pnpm db:generate
pnpm db:push
pnpm db:ensure

pnpm --filter @quickstart-ai/api dev      # :3100
pnpm --filter @quickstart-ai/worker dev   # BullMQ
pnpm --filter @quickstart-ai/web dev      # :3000
```

## Widgets

**React**

```tsx
import { ChatBot } from "@quickstart-ai/widget-react";
<ChatBot clientId="qs_..." apiUrl="http://localhost:3100" />
```

**HTML**

```html
<script
  src="/path/to/widget.js"
  data-client-id="qs_..."
  data-api-url="http://localhost:3100"
  async
></script>
```

Build vanilla bundle: `pnpm --filter @quickstart-ai/widget-vanilla build`

## Eval

```bash
pnpm eval
```

## Legacy migration

```bash
LEGACY_MONGODB_URI="mongodb://..." pnpm exec tsx scripts/migrate-legacy.ts
```

## Security notes (phase 5)

- No LLM keys in the browser; widgets only send `client_id`
- `client_secret` hashed at rest; shown once on create/rotate
- Origin allowlist per project; Redis sliding-window limits (IP + client)
- Helmet, body size 1MB, request IDs, admin role gate
- Rotate credentials after any leak; never commit `.env`
- Legacy `_legacy/` may contain old Firebase keys — do not reuse

## License

MIT
