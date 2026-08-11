# QuickStart demo account fixture

Used to seed a full demo tenant for local widget testing.

## Files

| File | Purpose |
|------|---------|
| `quickstart-demo-account.json` | Static template — credentials, onboarding Q&A, extra FAQs |
| `quickstart-demo-account.live.json` | Generated after seed — real `clientId`, project id, env snippet |

## Seed (requires API `:3100`, Postgres, Redis, worker)

```bash
pnpm docker:up
pnpm db:ensure
# start api + worker in other terminals, then:
pnpm seed:demo
```

Copy `NEXT_PUBLIC_DEMO_CLIENT_ID` from the live file into `.env`, restart web, then:

- **Landing:** http://localhost:3000 — live widget (bottom right)
- **Dashboard:** log in as `quickstart@gmail.com` / `password` — widget uses active project credentials

## Login

- Email: `quickstart@gmail.com`
- Password: `password`
