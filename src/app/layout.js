// src/app/layout.js (Server Component)
import './globals.css';
import ClientProviders from './ClientProviders';

export const metadata = {
  title: 'Westhill International',
  description: 'DMC Data analyze',
  icons: {
    icon: '/images/res_logo.png',
    shortcut: '/images/res_logo.png',
    apple: '/images/res_logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
</head>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}