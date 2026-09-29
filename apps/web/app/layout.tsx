import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'OpenFlow - Workflow Simulator',
  description: 'Requirements-driven CRM workflow simulator and laboratory',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
