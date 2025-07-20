
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SystemSettingsPage() {

  return (
    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                <Settings /> System Settings
            </CardTitle>
            <CardDescription>Configure platform-wide settings, integrations, and feature flags.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center h-64 p-8 border-2 border-dashed rounded-lg bg-background">
                <Settings className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-semibold font-headline">System Settings Coming Soon</p>
                <p className="text-muted-foreground">This section will provide controls for managing global application settings.</p>
            </div>
        </CardContent>
    </Card>
  );
}
