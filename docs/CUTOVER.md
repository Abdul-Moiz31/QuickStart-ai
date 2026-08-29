# Production cutover checklist

## Dual-run

1. Deploy `apps/api` + `apps/worker` with new `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`.
2. Run `scripts/migrate-legacy.ts` against legacy Mongo.
3. Keep old Express API live; issue new `client_id`s to early adopters.
4. Point dashboard (`apps/web`) `NEXT_PUBLIC_API_URL` at the new API.
5. Publish `@quickstart-ai/widget-react` / CDN `widget.js`.
6. Monitor `/health`, Redis rate-limit keys, ingest queue depth, eval scores.
7. When traffic is stable, decommission `quickstart-ai-server` / `chatbot-npm-backend`.

## Security harden

- [ ] Set strong `JWT_SECRET` and rotate
- [ ] `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none` behind HTTPS
- [ ] Restrict `CORS_ORIGINS`
- [ ] Set project `allowedOrigins` for every production project
- [ ] Configure real `OPENAI_API_KEY` (or compatible provider)
- [ ] Remove Firebase keys from any redeployed legacy code
- [ ] Enable DB backups (Postgres + Mongo)
- [ ] Alert on 429 spikes and ingest FAILED documents

## Load test smoke

```bash
# register + chat
curl -s localhost:3100/health
```
