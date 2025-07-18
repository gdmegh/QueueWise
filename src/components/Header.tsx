import { Users } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary rounded-lg">
          <Users className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary tracking-tight font-headline bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
          QueueWise
        </h1>
      </div>
    </header>
  );
}
