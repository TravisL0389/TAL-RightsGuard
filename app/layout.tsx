import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, IBM_Plex_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d1418',
};

export const metadata: Metadata = {
  title: 'RightsGuard AI',
  description: 'Deployment-ready AI music copyright workspace for rights analysis, platform reviews, release preparation, and evidence guidance.',
  manifest: '/manifest.json',
  keywords: ['AI music copyright', 'AI rights management', 'music licensing', 'copyright workflow', 'AI-generated music'],
  openGraph: {
    title: 'RightsGuard AI',
    description: 'A modern rights workspace for AI-generated music releases.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RightsGuard AI',
    description: 'A modern rights workspace for AI-generated music releases.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RightsGuard',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${cormorantGaramond.variable} ${ibmPlexMono.variable}`}>
      <body className="app-body text-slate-50 font-sans antialiased selection:bg-emerald-300 selection:text-slate-950" suppressHydrationWarning>
        <Sidebar />
        <main className="app-main">
          {children}
        </main>
      </body>
    </html>
  );
}
