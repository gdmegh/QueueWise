
'use client';

import { useEffect, useState, useCallback } from 'react';
import { QueueMember, Service } from '@/lib/types';
import { WaitTimeCard } from '@/components/queue/WaitTimeCard';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, UserCheck, Stethoscope, FlaskConical, Pill, HeartPulse } from 'lucide-react';
import * as QueueService from '@/lib/queue-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const serviceIcons: { [key: string]: React.ReactNode } = {
  'Consultation': <Stethoscope className="h-5 w-5" />,
  'Diagnostics': <FlaskConical className="h-5 w-5" />,
  'Pharmacy': <Pill className="h-5 w-5" />,
  'General Check-up': <HeartPulse className="h-5 w-5" />,
};

const REFRESH_INTERVAL_MS = 5000;

const NowServingCard = ({ member, service }: { member: QueueMember; service: Service }) => (
    <div className="bg-primary/20 border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg h-full animate-pulse">
        <div className="text-xl font-semibold text-primary mb-2">{service.counter}</div>
        <div className="text-5xl font-extrabold tracking-wider text-white mb-2">
            {member.ticketNumber}
        </div>
        <div className="text-lg text-primary-foreground/80">{member.name}</div>
        <Badge variant="secondary" className="mt-3">{service.name}</Badge>
    </div>
);

const UpNextCard = ({ counter, members }: { counter: string; members: {member: QueueMember, service: Service}[] }) => (
    <Card className="bg-card/50 h-full">
        <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-primary">{counter}</CardTitle>
        </CardHeader>
        <CardContent>
            {members.length > 0 ? (
                <ul className="space-y-2">
                    {members.slice(0, 3).map(({ member, service }, index) => (
                        <li key={`${member.id}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <Badge variant="secondary" className="text-md">{member.ticketNumber}</Badge>
                            <span className="text-sm text-muted-foreground">{service.name}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">Queue is empty</p>
            )}
        </CardContent>
    </Card>
);

export default function DisplayPage() {
    const [queue, setQueue] = useState<QueueMember[]>([]);
    const [servicedCount, setServicedCount] = useState(0);

    const refreshData = useCallback(() => {
        setQueue(QueueService.getQueue());
        setServicedCount(QueueService.getServiced().length);
    }, []);

    useEffect(() => {
        refreshData();
        const intervalId = setInterval(() => {
            QueueService.runQueueSimulation();
            refreshData();
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [refreshData]);

    const waitingQueue = queue.filter(m => m.status === 'waiting');
    
    // --- Data processing for the new layout ---
    const allCounters = Array.from(new Set(queue.flatMap(m => m.services.map(s => s.counter))));
    
    const nowServingByCounter = allCounters.map(counter => {
        const member = queue.find(m => m.services.some(s => s.counter === counter && s.status === 'in-progress'));
        if (member) {
            const service = member.services.find(s => s.counter === counter && s.status === 'in-progress');
            return { counter, member, service };
        }
        return { counter, member: null, service: null };
    }).filter(item => item.member && item.service);

    const upNextByCounter = allCounters.map(counter => {
        const members = queue
            .filter(m => m.services.some(s => s.counter === counter && s.status === 'pending'))
            .map(m => ({
                member: m,
                service: m.services.find(s => s.counter === counter && s.status === 'pending')!
            }))
            .sort((a, b) => new Date(a.member.checkInTime).getTime() - new Date(b.member.checkInTime).getTime());
        return { counter, members };
    });

    return (
        <main className="flex flex-col h-screen bg-background text-foreground p-8">
            <header className="text-center mb-6">
                <h1 className="text-6xl font-bold text-primary tracking-tight">
                    GD Clinic Status
                </h1>
            </header>

            <div className="flex-grow grid grid-cols-12 gap-8">
                {/* Left Section: Wait Time & Now Serving */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
                    <WaitTimeCard queueLength={waitingQueue.length} servicedCount={servicedCount} />
                    
                    <div className="flex-grow">
                        <h2 className="text-4xl font-bold text-primary flex items-center gap-3 mb-4"><UserCheck /> Now Serving</h2>
                        {nowServingByCounter.length > 0 ? (
                           <div className="space-y-4">
                             {nowServingByCounter.map(({ counter, member, service }) => (
                                <NowServingCard key={counter} member={member!} service={service!} />
                             ))}
                           </div>
                        ) : (
                            <Card className="bg-card/50 h-full flex items-center justify-center">
                                <CardContent className="text-center text-muted-foreground p-6">
                                    <p>All counters are currently available.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right Section: Up Next by Counter */}
                <div className="col-span-12 lg:col-span-8">
                    <h2 className="text-4xl font-bold text-primary flex items-center gap-3 mb-4"><Users /> Up Next</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 h-[calc(100%-4rem)]">
                        {upNextByCounter.map(({ counter, members }) => (
                            <UpNextCard key={counter} counter={counter} members={members} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
