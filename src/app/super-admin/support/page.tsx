
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy } from 'lucide-react';

export default function SupportPage() {

  return (
    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                <LifeBuoy /> Support Tickets
            </CardTitle>
            <CardDescription>View and manage support tickets from all users on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center h-64 p-8 border-2 border-dashed rounded-lg bg-background">
                <LifeBuoy className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-semibold font-headline">Support Ticket System Coming Soon</p>
                <p className="text-muted-foreground">This section will integrate a support system to manage all customer tickets centrally.</p>
            </div>
        </CardContent>
    </Card>
  );
}
