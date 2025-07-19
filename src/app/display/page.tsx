
'use client';

import { useEffect, useState, useCallback } from 'react';
import { QueueMember, Service } from '@/lib/types';
import { WaitTimeCard } from '@/components/queue/WaitTimeCard';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, UserCheck, Stethoscope, FlaskConical, Pill, HeartPulse, CheckCircle } from 'lucide-react';
import * as QueueService from '@/lib/queue-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { services as serviceCategories } from '@/lib/services';

const REFRESH_INTERVAL_MS = 5000;

const ServingTicket = ({ member, service }: { member: QueueMember; service: Service }) => (
     <div className="bg-primary/20 border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg h-full animate-pulse">
        <div className="text-4xl font-extrabold tracking-wider text-white mb-2">
            {member.ticketNumber}
        </div>
        <div className="text-md text-primary-foreground/80 truncate w-full">{member.name}</div>
    </div>
);

const AvailableCounter = () => (
     <div className="bg-muted/50 border-dashed border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center h-full">
        <CheckCircle className="h-8 w-8 text-green-500 mb-2"/>
        <div className="text-lg font-semibold text-muted-foreground">
            Available
        </div>
    </div>
)

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

const getAllCounters = () => {
    const counters = new Set<string>();
    const dive = (services: Service[]) => {
        for (const service of services) {
            counters.add(service.counter);
            if (service.subServices) {
                dive(service.subServices);
            }
        }
    }
    dive(serviceCategories.flatMap(c => c.subServices));
    return Array.from(counters);
}

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
    const allCounters = getAllCounters();
    
    const nowServingByCounter = allCounters.map(counter => {
        const member = queue.find(m => m.services.some(s => s.counter === counter && s.status === 'in-progress'));
        if (member) {
            const service = member.services.find(s => s.counter === counter && s.status === 'in-progress');
            return { counter, member, service };
        }
        return { counter, member: null, service: null };
    });

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
                        <div className="grid grid-cols-2 gap-4">
                            {nowServingByCounter.map(({ counter, member, service }) => (
                                <Card key={counter} className="bg-card/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-center text-lg">{counter}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {member && service ? (
                                            <ServingTicket member={member} service={service} />
                                        ) : (
                                            <AvailableCounter />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Section: Up Next by Counter */}
                <div className="col-span-12 lg:col-span-8">
                    <h2 className="text-4xl font-bold text-primary flex items-center gap-3 mb-4"><Users /> Up Next</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 h-[calc(100%-4rem)]">
                        {upNextByCounter.map(({ counter, members }) => (
                            <UpNextCard key={counter} counter={counter} members={members} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
