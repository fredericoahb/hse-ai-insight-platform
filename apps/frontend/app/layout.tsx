import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HSE-AI Insight Platform',
  description: 'AI-powered HSE reporting for Oil & Gas operations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
