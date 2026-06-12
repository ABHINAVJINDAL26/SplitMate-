import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Splitwise Clone — Premium Shared Expense Ledger',
  description: 'Track, split, and settle up your expenses effortlessly with beautiful visual analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
