
'use client';

import Link from 'next/link';
import { Users, LayoutDashboard, Monitor, Shield, UserCog, UserCircle, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { CompanySettings } from '@/lib/types';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import * as db from '@/lib/database';

export function Header() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({ name: '', logoUrl: '', primaryColor: '' });

  useEffect(() => {
    setCompanySettings(db.getCompanySettings());
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full py-3 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg flex items-center justify-center">
              {companySettings.logoUrl ? 
                <Image data-ai-hint="logo" src={companySettings.logoUrl} alt={`${companySettings.name} Logo`} width={24} height={24} className="object-contain" /> :
                <Users className="h-6 w-6 text-primary-foreground" />
              }
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight font-headline">
              {companySettings.name}
            </h1>
        </Link>
        <nav className="flex items-center gap-2">
           <Link href="/display" passHref>
            <Button variant="ghost">
                <Monitor className="mr-2 h-4 w-4" />
                Display
            </Button>
          </Link>
           <Link href="/account" passHref>
            <Button variant="ghost">
                <UserCircle className="mr-2 h-4 w-4" />
                My Account
            </Button>
          </Link>
           <Link href="/staff" passHref>
            <Button variant="ghost">
                <UserCog className="mr-2 h-4 w-4" />
                Staff
            </Button>
          </Link>
           <Link href="/admin" passHref>
            <Button variant="ghost">
                <Shield className="mr-2 h-4 w-4" />
                Admin
            </Button>
          </Link>
          <Link href="/super-admin" passHref>
            <Button variant="ghost">
                <Crown className="mr-2 h-4 w-4" />
                Super Admin
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
