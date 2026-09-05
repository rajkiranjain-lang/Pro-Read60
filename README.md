# Pro-Read60

Production-oriented social media platform built with Next.js App Router, PostgreSQL and Prisma.

## Build status

Phase 1–5 implementation is being built incrementally with end-to-end architecture, server-side authorization, moderation controls, and automated verification.

## Stack

- Next.js 16 (App Router)
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS

## Development

Copy `.env.example` to `.env`, configure PostgreSQL, then run:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
