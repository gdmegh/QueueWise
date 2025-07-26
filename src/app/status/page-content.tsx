
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QueueMember } from '@/lib/types';
import * as QueueService from '@/lib/queue-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Ticket, Users, UserCheck, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WaitTimeCard } from '@/components/queue/WaitTimeCard';

const REFRESH_INTERVAL_MS = 5000;

export default function StatusPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const ticketNumber = searchParams.get('ticketNumber');
    const [allQueue, setAllQueue] = useState<QueueMember[]>([]);
    const [servicedCount, setServicedCount] = useState(0);

    const refreshData = useCallback(() => {
        setAllQueue(QueueService.getQueue());
        setServicedCount(QueueService.getServiced().length);
    }, []);

    useEffect(() => {
        if (!ticketNumber) {
            toast({ title: 'Ticket Number Required', description: 'No ticket number found.', variant: 'destructive' });
            router.push('/');
            return;
        }

        refreshData();
        const intervalId = setInterval(() => {
            QueueService.runQueueSimulation();
            refreshData();
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [ticketNumber, router, toast, refreshData]);

    const myMember = allQueue.find(m => m.ticketNumber === ticketNumber);
    
    if (!myMember) {
        // It might be in the serviced list
        const servicedMember = QueueService.getServiced().find(m => m.ticketNumber === ticketNumber);
        if (servicedMember) {
             return (
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
                    <Card className="max-w-lg w-full text-center bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                        <CardHeader>
                            <div className="mx-auto bg-green-500/20 text-green-400 p-4 rounded-full w-fit">
                               <CheckCircle className="h-12 w-12" />
                            </div>
                            <CardTitle className="text-2xl text-primary">Service Completed!</CardTitle>
                            <CardDescription>Thank you for visiting, {servicedMember.name}. We hope to see you again soon.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => router.push('/')}>Return to Home</Button>
                        </CardContent>
                    </Card>
                </main>
             )
        }
        return (
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading your status...</p>
                </div>
            </main>
        );
    }

    const waitingQueue = allQueue.filter(m => m.status === 'waiting' || m.status === 'in-service');
    const myQueuePosition = waitingQueue.findIndex(m => m.ticketNumber === ticketNumber) + 1;
    const nowServing = allQueue.filter(m => m.status === 'in-service');

    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
            <div className="max-w-lg w-full space-y-6">
                <div className="text-center">
                    <Ticket className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight text-primary mt-4">Hello, {myMember.name}!</h1>
                    <p className="text-muted-foreground mt-2">Here is your current queue status. This page will update automatically.</p>
                </div>
                
                <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                    <CardHeader className="items-center text-center">
                        <CardTitle className="text-lg">Your Ticket Number</CardTitle>
                        <Badge variant="secondary" className="text-4xl font-bold tracking-widest px-8 py-4">{myMember.ticketNumber}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Your Position</p>
                                {myQueuePosition > 0 ? (
                                    <p className="text-3xl font-bold text-primary">{myQueuePosition}</p>
                                ) : (
                                    <p className="text-3xl font-bold text-green-400">Next!</p>
                                )}
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">People Ahead</p>
                                 <p className="text-3xl font-bold text-primary">{Math.max(0, myQueuePosition - 1)}</p>
                            </div>
                         </div>
                        <WaitTimeCard queueLength={myQueuePosition} servicedCount={servicedCount} />
                    </CardContent>
                </Card>

                 <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCheck /> Now Serving</CardTitle>
                        <CardDescription>Tickets currently being attended to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {nowServing.length > 0 ? (
                            <div className="flex flex-wrap gap-4 justify-center">
                                {nowServing.map(member => (
                                    <Badge key={member.id} variant="default" className="text-xl font-bold tracking-wider px-4 py-2">
                                        {member.ticketNumber}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                             <p className="text-center text-muted-foreground py-4">Service is about to begin...</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
