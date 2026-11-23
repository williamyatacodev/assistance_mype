import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Asistencia Perú - Control de Asistencia Laboral',
    template: '%s | Asistencia Perú',
  },
  description: 'Sistema de control de asistencia laboral inmutable para pequeñas empresas en Perú, alineado con normativa SUNAFIL.',
  keywords: ['asistencia', 'control horario', 'SUNAFIL', 'Perú', 'planillas', 'horas extra'],
  authors: [{ name: 'Asistencia Perú' }],
  creator: 'Asistencia Perú',
  publisher: 'Asistencia Perú',
  robots: 'noindex, nofollow',
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    siteName: 'Asistencia Perú',
    title: 'Asistencia Perú - Control de Asistencia Laboral',
    description: 'Sistema de control de asistencia laboral inmutable para pequeñas empresas en Perú.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asistencia Perú',
    description: 'Control de asistencia laboral inmutable para PYMEs en Perú.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Asistencia Perú" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}