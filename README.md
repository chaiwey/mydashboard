This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Local development database

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres on localhost:5432
npm run dev
```

## Deploy with Docker / Dokploy

The production stack is defined in `docker-compose.yml` (Postgres + a one-shot
migration job + the app) and built from the multi-stage `Dockerfile`
(`output: "standalone"` for a lean ~330 MB image).

1. In Dokploy, create a **Compose** application pointing at this repo.
2. Copy the variables from `.env.dokploy.example` into Dokploy's **Environment**
   panel and fill in real values (secrets: `openssl rand -base64 32`; VAPID:
   `npx web-push generate-vapid-keys`).
3. Add a domain in Dokploy pointing to the `app` service on port `3000`.
4. Deploy. On each deploy the `migrate` service runs `prisma migrate deploy`
   before the app starts.

> **Note:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is baked into the client bundle at
> build time (must equal `VAPID_PUBLIC_KEY`); changing it requires a rebuild.

The `/api/cron` endpoint (push-notification dispatch) is not scheduled by the
stack — point any external scheduler at `POST /api/cron` with the header
`Authorization: Bearer $CRON_SECRET`.

To run the production stack locally:

```bash
cp .env.dokploy.example .env
docker network create dokploy-network   # or comment out that network in docker-compose.yml
docker compose up --build
```
