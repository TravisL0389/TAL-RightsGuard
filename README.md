# RightsGuard AI

RightsGuard AI is a deployment-ready rights workspace for AI-generated music. It helps artists, producers, and labels understand ownership, commercial usage rights, registration boundaries, and the evidence they need before releasing AI-assisted tracks.

## Project Structure

This project is built with Next.js App Router and includes both a modern product UI and secure server-side Gemini integrations.

- `/app` - Next.js 15 App Router pages and layouts.
  - `/` - Executive dashboard and release-readiness workspace
  - `/agent` - AI Rights Agent chat interface
  - `/platforms` - Platform database and live terms analyzer
  - `/playbooks` - Copyright workflow and release packet playbooks
  - `/pricing` - Plan and workflow tiers
  - `/api/chat` - Server-side Gemini chat route
  - `/api/platform-analysis` - Server-side Gemini terms analysis route
- `/components` - Reusable UI components.
- `/lib` - Shared data, platform intelligence, and Gemini helpers.
- `/public` - Static assets and PWA manifest.
- `package.json` - Dependencies and build scripts.
- `next.config.ts` - Next.js configuration (set to `standalone` for optimized deployments).
- `.env.example` - Required environment variables.

## Prerequisites

- Node.js 18.17 or later
- npm, pnpm, or yarn
- A Google Gemini API Key

## Local Development Setup

1. **Install Dependencies**
   Run the following command to install all required packages:
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   `NEXT_PUBLIC_GEMINI_API_KEY` is still accepted as a fallback for compatibility, but `GEMINI_API_KEY` is the recommended production setting because AI calls now run on the server.

3. **Run the Development Server**
   Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Deployment Instructions

This project is configured for seamless deployment to any modern hosting provider (Vercel, Google Cloud Run, AWS, Netlify).

### Deploying to Vercel (Recommended)
1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Import the project into Vercel.
3. Add the `GEMINI_API_KEY` environment variable in the Vercel dashboard.
4. Click **Deploy**. Vercel will automatically detect Next.js and build the project.

### Deploying via Docker / Cloud Run
The project uses `output: 'standalone'` in `next.config.ts`, which drastically reduces the build size for Docker containers.
1. Build the project: `npm run build`
2. The standalone output will be generated in `.next/standalone`.
3. You can containerize this output and deploy it to Google Cloud Run or AWS ECS.

## Features & Functionality

- **Release-Readiness Dashboard:** Clear explanation of composition rights, master rights, platform license rights, and evidence requirements.
- **AI Rights Agent:** Server-side Gemini chat for live platform and copyright analysis.
- **Platform Intelligence:** Searchable platform database with watchouts, usage rules, and live URL analysis.
- **Playbooks:** Practical workflows for intake, disclosure, registration prep, and release packet assembly.
- **Responsive UI:** Optimized for desktop and mobile with a polished app-shell navigation pattern.
- **PWA Ready:** Includes manifest metadata and local app icons.

## Shared SaaS Core

RightsGuard now includes the same sellable-app backbone as the inventory app, with Azure-first support:

- Azure PostgreSQL workspace/account snapshot support at `app/api/account/route.ts`
- Azure-aware workspace bootstrap at `app/api/bootstrap-workspace/route.ts`
- Stripe checkout and portal routes under `app/api/billing`
- Stripe webhook sync route at `app/api/stripe-webhook/route.ts`
- Azure Blob evidence upload route at `app/api/storage/evidence-upload/route.ts`
- Health/readiness route at `app/api/health/route.ts`
- Shared schema in `supabase/migrations/20260429_shared_rightsguard_saas_core.sql`

Copy `.env.example` to `.env.local` and fill in:

```env
GEMINI_API_KEY=your_gemini_api_key_here
AZURE_POSTGRES_URL=postgresql://username:password@your-server.postgres.database.azure.com:5432/rightsguard
AZURE_POSTGRES_SSL=true
AZURE_BLOB_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey;EndpointSuffix=core.windows.net
AZURE_BLOB_CONTAINER_EVIDENCE=rights-evidence
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_123
STRIPE_WEBHOOK_SECRET=whsec_123
STRIPE_PRICE_STARTER=price_starter_123
STRIPE_PRICE_PRO=price_pro_123
STRIPE_PRICE_STUDIO=price_studio_123
RESEND_API_KEY=re_123
APP_BASE_URL=http://localhost:3000
DEFAULT_WORKSPACE_SLUG=rightsguard
```

Azure mode only requires `AZURE_POSTGRES_URL`, `AZURE_BLOB_CONNECTION_STRING`, Stripe, and Gemini. Supabase stays optional if you still want hosted auth later. In Azure owner mode, the sidebar can bootstrap the first workspace without a Supabase sign-in.

Apply the SQL migration before switching the app from seeded workspace mode to a live backend mode.

## Quality Assurance
- All forms include validation and error states.
- Gemini usage is routed through server endpoints to avoid exposing the API key in the browser.
- UI components are structured for responsive layout stability.
- Animations are subtle and restrained, with reduced-motion support in CSS.
- Accessibility considerations include semantic structure, focus states, and contrast-aware UI choices.
