
'use client';

import { Bell } from 'lucide-react';
import type { QueueMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface NowServingCardProps {
    nowServing: QueueMember[];
}

export const NowServingCard = ({ nowServing }: NowServingCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-accent/20 to-primary/20 border-primary/50">
      <CardHeader>
        <CardTitle className="text-3xl text-primary flex items-center justify-center gap-4">
          <Bell className="animate-pulse" /> Now Serving
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {nowServing.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nowServing.map((member) => (
              <div key={member.id} className="p-4 rounded-lg bg-background/50">
                <p className="text-4xl font-bold tracking-wider text-foreground">{member.ticketNumber}</p>
                <p className="text-lg text-muted-foreground mt-1">{member.name}</p>
                <div className="text-xl font-semibold text-primary mt-2">
                  {member.services?.map((service, index) => (
                    <p key={index}>{service.counter}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8">No one is currently being served. Please check in to get a ticket.</p>
        )}
      </CardContent>
    </Card>
  );
};
