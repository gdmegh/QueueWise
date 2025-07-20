
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function SubscriptionsPage() {

  return (
    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                <CreditCard /> Subscriptions & Plans
            </CardTitle>
            <CardDescription>Manage subscription plans, pricing, and features for the platform.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="flex flex-col items-center justify-center text-center h-64 p-8 border-2 border-dashed rounded-lg bg-background">
                <CreditCard className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-semibold font-headline">Subscription Management Coming Soon</p>
                <p className="text-muted-foreground">This section will allow you to create and manage subscription plans and view company subscription statuses.</p>
            </div>
        </CardContent>
    </Card>
  );
}
