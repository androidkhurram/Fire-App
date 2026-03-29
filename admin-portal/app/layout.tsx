import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FireApp Admin Portal',
  description: 'Admin dashboard for FireApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
