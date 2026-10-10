import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const orbitSans = Source_Sans_3({
  variable: '--font-orbit-sans',
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ORBIT — Digital Collectibles',
  description: 'Discover and trade digital collectibles',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${orbitSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </body>
    </html>
  );
}
