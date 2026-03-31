import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NYC Rentals — Find Your Next Place',
  description: 'Short-term rentals in New York City. Browse listings by borough and price.',
};

// Root layout: provides html/body/font.
// Nav, footer, and i18n providers live in app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen flex flex-col bg-white text-[#111111]">
        {children}
      </body>
    </html>
  );
}
