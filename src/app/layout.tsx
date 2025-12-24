import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider, AuthProvider } from '@/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Web3 Store | Digital Goods Marketplace',
  description: 'Purchase premium digital goods with cryptocurrency. Secure, private, and decentralized.',
  keywords: ['web3', 'crypto', 'digital goods', 'USDT', 'polygon'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Web3Provider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
