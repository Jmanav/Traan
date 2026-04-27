import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Traan — Crisis Coordination for NGOs',
  description:
    'Traan converts unstructured field signals — voice notes, photos, texts — into a live operational picture for NGO coordinators managing disaster response.',
  applicationName: 'Traan',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Traan',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-inter bg-base text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
