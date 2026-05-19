'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export default function ClientProviders({ children }) {
  return (
    <>
      <SessionProvider>{children}</SessionProvider>
      <Toaster position="top-right" />
    </>
  );
}