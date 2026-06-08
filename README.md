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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Environment Variables

Before deploying, ensure you set the following environment variables in your Vercel project settings:

**Database:**
- `DATABASE_URL` - PostgreSQL connection string (use Vercel Postgres or external database)
- `POSTGRES_PRISMA_URL` - PostgreSQL connection string for Prisma client
- `POSTGRES_URL_NON_POOLING` - Non-pooled PostgreSQL connection URL
- `DIRECT_URL` - Direct database connection URL

**Authentication:**
- `ADMIN_SECRET` - Secret key for admin access
- `CRON_SECRET` - Secret key for cron job authentication

**Optional:**
- `PETROL_API_KEY` - API key for petrol price updates (for cron job)

### Deployment Steps

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in Vercel
3. Configure environment variables in Vercel project settings
4. Deploy - Vercel will automatically run `npm install` and `npm run build`
5. The cron job for petrol price updates will be automatically configured

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
