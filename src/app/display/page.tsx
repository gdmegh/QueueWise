
'use client';

import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { QueueMember, SubService } from '@/lib/types';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, UserCheck } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { services } from '@/lib/services';

const REFRESH_INTERVAL_MS = 15000; // 15 seconds

const createInitialQueue = (): QueueMember[] => {
    const now = new Date();
    const queue: QueueMember[] = [];
    
    // Distribute services to create a predictable queue for each counter
    const counterServices: { [key: string]: SubService[] } = {
        'Counter 1': services[0].subServices.filter(s => s.counter === 'Counter 1' || s.name === 'General Inquiry'),
        'Counter 2': services[0].subServices.filter(s => s.counter === 'Counter 2'),
        'Counter 3': services[2].subServices.filter(s => s.counter === 'Counter 3'),
        'Counter 4': services[1].subServices.filter(s => s.counter === 'Counter 4'),
        'Counter 5': [services[1].subServices[1]], // Extra mortgage
        'Counter 6': [services[2].subServices[2]], // Extra wire transfer
    };

    // Make sure all counters have at least one service type to assign
    if (counterServices['Counter 5'].length === 0) counterServices['Counter 5'] = [services[0].subServices[0]];
    if (counterServices['Counter 6'].length === 0) counterServices['Counter 6'] = [services[0].subServices[1]];


    for (let i = 0; i < 50; i++) {
        const checkInTime = new Date(now.getTime() - (50 - i) * 2 * 60000);
        const isInService = i < 6;
        
        // Assign customers to counters in a round-robin fashion for a distributed queue
        const counterIndex = (i % 6) + 1;
        const counterName = `Counter ${counterIndex}`;
        const servicePool = counterServices[counterName];
        const assignedService = servicePool[Math.floor(Math.random() * servicePool.length)];

        const memberService = {
            ...assignedService,
            counter: isInService ? counterName : assignedService.counter // Assign to specific counter only if in service
        };

        queue.push({
            id: Date.now() + i,
            ticketNumber: `A-${String(i + 1).padStart(3, '0')}`,
            name: `Customer ${i + 1}`,
            phone: `012345678${String(10 + i).padStart(2, '0')}`,
            checkInTime: checkInTime,
            estimatedServiceTime: new Date(checkInTime.getTime() + (i + 1) * assignedService.avgTime * 60000),
            status: isInService ? 'in-service' : 'waiting',
            services: [memberService],
            assignedTo: isInService ? (i % 4) + 2 : undefined,
        });
    }
    return queue;
};


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
        if (servingMemberForThisCounter) {
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
                                    <span>{getWaitTimeForMember(index)} min</span>
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
    const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', createInitialQueue());
    const [serviced] = useLocalStorage<QueueMember[]>('serviced', []);

    // Force a re-render on an interval to pick up local storage changes
    useEffect(() => {
        const intervalId = setInterval(() => {
            window.dispatchEvent(new Event('storage'));
        }, REFRESH_INTERVAL_MS);
        
        const simulation = setInterval(() => {
          setQueue(prevQueue => {
            const nowServing = prevQueue.filter(m => m.status === 'in-service');
            let newQueue = [...prevQueue];

            // 1. Check if any 'in-service' customers are done
            const now = new Date();
            nowServing.forEach(member => {
                if (new Date(member.estimatedServiceTime) <= now) {
                    // Move from queue to serviced
                    newQueue = newQueue.filter(m => m.id !== member.id);
                }
            });
            
            // 2. Fill empty counters
            const servingCounters = newQueue.filter(m => m.status === 'in-service').flatMap(m => m.services.map(s => s.counter));
            const availableCounters = Array.from({length: 6}, (_, i) => `Counter ${i+1}`).filter(c => !servingCounters.includes(c));
            
            if (availableCounters.length > 0) {
              const waitingByCounter: {[key: string]: QueueMember[]} = {};
              newQueue.filter(m => m.status === 'waiting').forEach(m => {
                  m.services.forEach(s => {
                    if (!waitingByCounter[s.counter]) waitingByCounter[s.counter] = [];
                    if (!waitingByCounter[s.counter].find(wm => wm.id === m.id)) {
                        waitingByCounter[s.counter].push(m);
                    }
                  });
              });

              availableCounters.forEach(counterName => {
                  if (waitingByCounter[counterName] && waitingByCounter[counterName].length > 0) {
                      const nextInLine = waitingByCounter[counterName].sort((a,b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime())[0];
                      
                       newQueue = newQueue.map(member => 
                        member.id === nextInLine.id 
                        ? { 
                            ...member, 
                            status: 'in-service',
                            services: member.services.map(s => ({...s, counter: counterName})), // Assign to this counter
                            estimatedServiceTime: new Date(Date.now() + member.services.reduce((acc, s) => acc + s.avgTime, 0) * 60000)
                          } 
                        : member
                      );
                  }
              });
            }
            
            return newQueue;
          });
        }, 10000); // Run simulation every 10 seconds

        return () => {
          clearInterval(intervalId);
          clearInterval(simulation);
        };
    }, [setQueue]);

    const nowServing = queue.filter(m => m.status === 'in-service');
    const waitingQueue = queue.filter(m => m.status === 'waiting');
    
    const counterNames = Array.from({ length: 6 }, (_, i) => `Counter ${i + 1}`);

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
                <h1 className="text-6xl font-bold text-primary tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
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
                      <WaitTimeCard queueLength={waitingQueue.length} servicedCount={serviced.length + queue.filter(q => q.status === 'serviced').length} />
                    </div>
                </div>

                {/* Counter-specific Queues */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                     <h2 className="text-4xl font-bold text-primary flex items-center gap-3"><Users /> Up Next By Counter</h2>
                    <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-grow">
                         {counterQueues.map(({ name, queue }) => (
                            <CounterQueueCard key={name} title={name} queue={queue} nowServing={nowServing} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
