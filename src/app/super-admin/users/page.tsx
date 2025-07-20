
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function UserManagementPage() {

  return (
    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                <Users /> User Management
            </CardTitle>
            <CardDescription>View and manage all users across all companies on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center h-64 p-8 border-2 border-dashed rounded-lg bg-background">
                <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-semibold font-headline">User Management Coming Soon</p>
                <p className="text-muted-foreground">This section will allow you to search, view, and manage all user accounts.</p>
            </div>
        </CardContent>
    </Card>
  );
}
