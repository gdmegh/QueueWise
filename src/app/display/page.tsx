
'use client';

import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { QueueMember } from '@/lib/types';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import { Badge } from '@/components/ui/badge';
import { Bell, Users, List, Banknote, HandCoins, Clock, UserCheck } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const REFRESH_INTERVAL_MS = 15000; // 15 seconds

const serviceIcons: { [key: string]: React.ReactNode } = {
    'General Inquiry': <List className="h-8 w-8" />,
    'Account Services': <Banknote className="h-8 w-8" />,
    'Card Services': <Banknote className="h-8 w-8" />,
    'Personal Loan': <HandCoins className="h-8 w-8" />,
    'Mortgage Application': <HandCoins className="h-8 w-8" />,
    'Loan Payment': <HandCoins className="h-8 w-8" />,
    'Deposit': <Banknote className="h-8 w-8" />,
    'Withdrawal': <Banknote className="h-8 w-8" />,
    'Wire Transfer': <Banknote className="h-8 w-8" />,
    'Pending': <List className="h-8 w-8" />,
};

const getWaitTime = (member: QueueMember, nowServing?: QueueMember): number => {
    const now = new Date();
    // If this member is currently being served, their wait time is 0.
    if (nowServing && nowServing.id === member.id) {
        return 0;
    }
    // If someone is being served, calculate wait time from their estimated service end time.
    if (nowServing) {
        const servingEndTime = new Date(nowServing.estimatedServiceTime);
        // Ensure we don't show a negative wait time if the estimate has passed.
        return Math.max(0, differenceInMinutes(servingEndTime, now));
    }
    // If no one is being served, calculate from the member's own check-in time.
    return Math.max(0, differenceInMinutes(now, new Date(member.checkInTime)));
};

const CounterStatusCard = ({ counterNumber, member }: { counterNumber: number; member: QueueMember | null }) => (
    <Card className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg transition-all duration-500 ${member ? 'bg-primary/20 border-primary animate-pulse' : 'bg-muted/50'}`}>
        <CardHeader className="p-2 text-center">
            <CardTitle className="text-2xl text-primary/80 font-semibold">Counter {counterNumber}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex flex-col items-center justify-center flex-grow">
            {member ? (
                <>
                    <div className="text-5xl font-extrabold tracking-wider text-white mb-2">
                        {member.ticketNumber}
                    </div>
                    <div className="text-lg text-muted-foreground truncate">
                        {member.name}
                    </div>
                </>
            ) : (
                <div className="text-2xl text-muted-foreground/50">Available</div>
            )}
        </CardContent>
    </Card>
);

export default function DisplayPage() {
    const [queue] = useLocalStorage<QueueMember[]>('queue', []);
    const [serviced] = useLocalStorage<QueueMember[]>('serviced', []);

    // Force a re-render on an interval to pick up local storage changes
    useEffect(() => {
        const intervalId = setInterval(() => {
            // This is a dummy state update to trigger a re-render
            // as useLocalStorage doesn't auto-update across tabs.
            // In a real app, you'd use a real-time backend (e.g., Firestore).
            window.dispatchEvent(new Event('storage'));
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, []);

    const nowServing = queue.filter(m => m.status === 'in-service');
    const upNext = queue.filter(m => m.status === 'waiting').slice(0, 10); // Limit to next 10

    const counters = Array.from({ length: 6 }, (_, i) => {
        const counterName = `Counter ${i + 1}`;
        const servingMember = nowServing.find(m => m.services.some(s => s.counter === counterName));
        return {
            number: i + 1,
            member: servingMember || null,
        };
    });


    return (
        <main className="flex flex-col h-screen bg-background text-foreground p-8">
            <header className="text-center mb-8">
                <h1 className="text-6xl font-bold text-primary tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                    Queue Status
                </h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 flex-grow gap-8">
                {/* Now Serving Section */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                     <h2 className="text-4xl font-bold text-primary flex items-center gap-3"><UserCheck /> Now Serving</h2>
                     <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-grow">
                        {counters.map(counter => (
                            <CounterStatusCard key={counter.number} counterNumber={counter.number} member={counter.member} />
                        ))}
                    </div>
                </div>

                {/* Up Next & Wait Time Section */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="bg-card/50 rounded-xl shadow-lg p-8 flex-grow">
                        <h2 className="text-4xl font-bold text-primary mb-6 flex items-center gap-3"><Users /> Up Next</h2>
                        <div className="space-y-4">
                            {upNext.length > 0 ? upNext.map((member, index) => (
                                <div key={member.id} className="grid grid-cols-4 items-center bg-muted p-4 rounded-lg gap-4">
                                    <Badge variant="secondary" className="text-4xl px-4 py-2 col-span-1 justify-center">{member.ticketNumber}</Badge>
                                    <div className="text-3xl font-medium text-foreground col-span-1">{member.name}</div>
                                    <div className="flex items-center gap-3 col-span-1">
                                        {(member.services || []).map((service, i) => (
                                            <div key={i} className="flex items-center gap-2 text-muted-foreground" title={service.name}>
                                                {serviceIcons[service.name] || <List className="h-8 w-8" />}
                                            </div>
                                        ))}
                                        {(!member.services || member.services.length === 0) && (
                                            <List className="h-8 w-8 text-muted-foreground" title="Pending Selection" />
                                        )}
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end gap-2 text-2xl text-muted-foreground">
                                        <Clock className="h-6 w-6" />
                                        <span>{getWaitTime(upNext[index + 1] || member, nowServing[0])} min</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-2xl text-muted-foreground p-10">The queue is empty.</div>
                            )}
                        </div>
                    </div>
                    <div className="min-h-[240px]">
                      <WaitTimeCard queueLength={queue.filter(q => q.status === 'waiting').length} servicedCount={serviced.length + queue.filter(q => q.status === 'serviced').length} />
                    </div>
                </div>
            </div>
        </main>
    );
}
