
'use client';

import { useEffect, useState, useCallback } from 'react';
import { QueueMember } from '@/lib/types';
import { WaitTimeCard } from '@/components/queue/WaitTimeCard';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, UserCheck } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as QueueService from '@/lib/queue-service';

const REFRESH_INTERVAL_MS = 5000; // 5 seconds for faster updates

const CounterStatusCard = ({ counterNumber, member }: { counterNumber: number; member: QueueMember | null }) => (
    <Card className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg transition-all duration-500 ${member ? 'bg-primary/20 border-primary animate-pulse' : 'bg-muted/50'}`}>
        <CardHeader className="p-2 text-center">
            <CardTitle className="text-2xl text-primary/80 font-semibold">Counter {counterNumber}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex flex-col items-center justify-center flex-grow">
            {member ? (
                <div className="text-5xl font-extrabold tracking-wider text-white mb-2">
                    {member.ticketNumber}
                </div>
            ) : (
                <div className="text-2xl text-muted-foreground/50">Available</div>
            )}
        </CardContent>
    </Card>
);

const CounterQueueCard = ({ title, queue, nowServing }: { title: string; queue: QueueMember[]; nowServing: QueueMember[] }) => {
    const getWaitTimeForMember = (memberIndex: number): number => {
        const now = new Date();
        const servingMemberForThisCounter = nowServing.find(m => m.services.some(s => s.counter === title));
        
        let waitTime = 0;
        
        // Time for the person currently being served at this counter
        if (servingMemberForThisCounter && servingMemberForThisCounter.status === 'in-service' && servingMemberForThisCounter.estimatedServiceTime) {
            waitTime += Math.max(0, differenceInMinutes(new Date(servingMemberForThisCounter.estimatedServiceTime), now));
        }

        // Add time for people ahead in this specific counter's queue
        for (let i = 0; i < memberIndex; i++) {
             const personAhead = queue[i];
             waitTime += personAhead.services.reduce((acc, s) => acc + s.avgTime, 0);
        }

        return waitTime;
    }

    return (
        <Card className="bg-card/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl text-primary">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {queue.length > 0 ? (
                        queue.slice(0, 2).map((member, index) => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <Badge variant="secondary" className="text-lg">{member.ticketNumber}</Badge>
                                <div className="flex items-center gap-2 text-lg text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>~{getWaitTimeForMember(index)} min</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No one waiting.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


export default function DisplayPage() {
    const [queue, setQueue] = useState<QueueMember[]>([]);
    const [servicedCount, setServicedCount] = useState(0);

    const refreshData = useCallback(() => {
        setQueue(QueueService.getQueue());
        setServicedCount(QueueService.getServiced().length);
    }, []);

    // Initial data load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Set up the simulation and refresh interval
    useEffect(() => {
        const simulationId = setInterval(() => {
            QueueService.runQueueSimulation();
            refreshData(); // Refresh the component state with the latest data
        }, REFRESH_INTERVAL_MS);

        return () => {
          clearInterval(simulationId);
        };
    }, [refreshData]);

    const nowServing = queue.filter(m => m.status === 'in-service');
    const waitingQueue = queue.filter(m => m.status === 'waiting');
    
    const counterNames = Array.from({ length: 6 }, (_, i) => `Room ${i + 1}`);

    const counters = counterNames.map((name, i) => {
        const servingMember = nowServing.find(m => m.services.some(s => s.counter === name));
        return {
            number: i + 1,
            name: name,
            member: servingMember || null,
        };
    });

    const getQueueForCounter = (counterName: string): QueueMember[] => {
        return waitingQueue
            .filter(member => member.services.some(service => service.counter === counterName))
            .sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
    };

    const counterQueues = counterNames.map(name => ({
        name: name,
        queue: getQueueForCounter(name),
    }));

    return (
        <main className="flex flex-col h-screen bg-background text-foreground p-8">
            <header className="text-center mb-6">
                <h1 className="text-6xl font-bold text-primary tracking-tight">
                    Queue Status
                </h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 flex-grow gap-8">
                {/* Now Serving & Wait Time Section */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                     <h2 className="text-4xl font-bold text-primary flex items-center gap-3"><UserCheck /> Now Serving</h2>
                     <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-grow">
                        {counters.map(counter => (
                            <CounterStatusCard key={counter.number} counterNumber={counter.number} member={counter.member} />
                        ))}
                    </div>
                     <div className="min-h-[240px]">
                      <WaitTimeCard queueLength={waitingQueue.length} servicedCount={servicedCount} />
                    </div>
                </div>

                {/* Counter-specific Queues */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                     <h2 className="text-4xl font-bold text-primary flex items-center gap-3"><Users /> Up Next By Room</h2>
                    <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-grow">
                         {counterQueues.map(({ name, queue: counterQueue }) => (
                            <CounterQueueCard key={name} title={name} queue={counterQueue} nowServing={nowServing} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
