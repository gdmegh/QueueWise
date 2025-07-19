import Link from 'next/link';
import { Users, LayoutDashboard, Monitor, Shield, UserCog, UserCircle } from 'lucide-react';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full py-3 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight font-headline bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
              QueueWise
            </h1>
        </Link>
        <nav className="flex items-center gap-2">
           <Link href="/live-queue" passHref>
            <Button variant="ghost">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Live Queue
            </Button>
          </Link>
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
        </nav>
      </div>
    </header>
  );
}
