# Security baseline

## Credentials

- Dashboard auth: JWT in httpOnly cookie + optional `Authorization: Bearer`
- Widget auth: `X-Client-Id` (public). Optional `X-Client-Secret` for server-to-server
- Secrets hashed with SHA-256 at rest; plaintext shown once on create/rotate
- Project `allowedOrigins` enforced when `Origin` header is present

## Rate limiting

- Redis sliding window per IP (`RATE_LIMIT_MAX_IP`) and per client (`RATE_LIMIT_MAX_CLIENT`)
- Fails open only if Redis is unreachable in local/dev (still logs)

## Request hygiene

- Helmet enabled
- Body limit 1MB (down from legacy 150MB)
- Zod validation on public inputs
- Request IDs via Fastify

## RAG / LLM

- All model calls server-side only
- Low-confidence answers can escalate; cache skipped for low confidence
- Prompt injection mitigated by grounded-tool answers + system instructions

## Ops

- See [CUTOVER.md](./CUTOVER.md) for dual-run and production checklist
- Never commit `.env`; rotate `JWT_SECRET` before production
