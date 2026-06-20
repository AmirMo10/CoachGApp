import type { Metadata } from 'next';
import { Inter, Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const vazir = Vazirmatn({ subsets: ['arabic'], variable: '--font-vazir', display: 'swap' });

export const metadata: Metadata = {
  title: 'Coach"G" — AI Coaching Platform',
  description: 'Generate personalized training, nutrition, and recovery programs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${vazir.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
