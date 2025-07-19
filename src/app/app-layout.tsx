'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/Header';

// This is a client component because we need to check the pathname
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDisplayPage = pathname === '/display';

  return (
     <body className="font-body antialiased h-full bg-gradient-to-br from-background to-black">
        {!isDisplayPage && <Header />}
        {children}
        <Toaster />
      </body>
  )
}
