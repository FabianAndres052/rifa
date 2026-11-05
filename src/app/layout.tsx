import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Super Rifa Navideña | Administración y Control en Tiempo Real',
  description:
    'Plataforma profesional de administración y control de la Super Rifa Navideña de 100 números (00-99). Gran Premio Mayor: Moto Eléctrica GW E-MAX 800W Roja. Juega con la Lotería Sinuano Noche.',
  keywords: [
    'Rifa',
    'Moto Eléctrica',
    'Sinuano Noche',
    'Rifa Navideña',
    'Cartón Interactivo',
    'Administración',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
