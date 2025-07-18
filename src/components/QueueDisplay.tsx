import type { FC } from 'react';
import { format } from 'date-fns';
import { Bell, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { QueueMember } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface QueueDisplayProps {
  queue: QueueMember[];
}

export const QueueDisplay: FC<QueueDisplayProps> = ({ queue }) => {
  return (
     <Card className="h-full bg-card/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-primary"><Users /> Live Queue</CardTitle>
            <CardDescription>Current waiting list and estimated service times.</CardDescription>
        </CardHeader>
        <CardContent>
            {queue.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Ticket</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Est. Service Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {queue.map((member, index) => (
                                <TableRow key={member.id} className={index === 0 ? 'bg-accent/10' : ''}>
                                <TableCell className="font-medium">
                                    <Badge variant={index === 0 ? "default" : "secondary"} className="bg-primary/80 text-primary-foreground">{member.ticketNumber}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 font-medium">
                                        {member.name}
                                        {index === 0 && <Bell className="w-4 h-4 text-primary animate-pulse" />}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    {format(member.estimatedServiceTime, 'h:mm a')}
                                </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center h-64 p-8 border-2 border-dashed rounded-lg bg-background">
                    <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-semibold font-headline">The queue is empty!</p>
                    <p className="text-muted-foreground">New check-ins will appear here.</p>
                </div>
            )}
        </CardContent>
     </Card>
  );
};
