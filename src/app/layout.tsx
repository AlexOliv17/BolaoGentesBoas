import type { Metadata, Viewport } from 'next';
import { Oswald, Nunito } from 'next/font/google';
import '@/styles/globals.css';

/** Fonte de display — títulos, placares, números grandes */
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

/** Fonte de corpo — legível e neutra */
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Bolão Copa 2026',
    default: 'Bolão Copa 2026',
  },
  description:
    'Dispute o bolão da Copa do Mundo 2026 com seus amigos. Palpite, pontue e suba no ranking!',
  robots: { index: false, follow: false }, // privado por enquanto
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Impede zoom automático em inputs no iOS (complementa o font-size >=16px nos inputs)
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${oswald.variable} ${nunito.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Ir para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
