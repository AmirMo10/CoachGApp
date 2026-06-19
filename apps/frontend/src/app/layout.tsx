import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coach"G" — AI Coaching Platform',
  description: 'Generate personalized training, nutrition, and recovery programs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
