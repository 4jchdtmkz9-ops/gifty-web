import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
      </body>
    </html>
  );
}
