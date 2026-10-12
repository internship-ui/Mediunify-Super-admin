import './globals.css';
import { AppProviders } from '@/providers/AppProviders';

export const metadata = {
  title: 'MediUnify — Super Admin Healthcare Portal',
  description:
    'Comprehensive Healthcare Operations, Clinical Governance, Doorstep Pharmacy, Emergency SOS, and Patient Administration Portal for Karnataka.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F7FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
