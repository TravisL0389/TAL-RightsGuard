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

## Quality Assurance
- All forms include validation and error states.
- Gemini usage is routed through server endpoints to avoid exposing the API key in the browser.
- UI components are structured for responsive layout stability.
- Animations are subtle and restrained, with reduced-motion support in CSS.
- Accessibility considerations include semantic structure, focus states, and contrast-aware UI choices.
