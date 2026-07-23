import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.scss';

const sfPro = localFont({
  src: [
    {
      path: '../assets/fonts/SF-Pro-Display-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SF-Pro-Display-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-sf-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MOTORWAY — Автомобили из Японии, Кореи и Китая',
  description: 'MOTORWAY предлагает широкий выбор автомобилей из Японии, Кореи и Китая. Лучшие модели, высокое качество и надежность. Найдите свой идеальный автомобиль прямо сейчас.',
  icons: {
    icon: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={sfPro.variable}>
      <body>{children}</body>
    </html>
  );
}
