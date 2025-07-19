

'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { differenceInMinutes } from 'date-fns';

import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { CheckInForm } from '@/components/CheckInForm';
import { QueueDisplay } from '@/components/QueueDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import type { QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Bell, Edit } from 'lucide-react';
import { services } from '@/lib/services';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  phone: z.string().regex(/^\d{11}$/, { message: 'Please enter a valid 11-digit phone number.' }),
});

const MAX_QUEUE_SIZE = 100; // Increased max queue size
const SIMULATION_INTERVAL_MS = 20000; // 20 seconds for simulation

const createInitialQueue = (): QueueMember[] => {
    const now = new Date();
    return Array.from({ length: 50 }, (_, i) => {
        const checkInTime = new Date(now.getTime() - (50 - i) * 2 * 60000); // Staggered check-in times
        const service = services[i % services.length].subServices[0];
        const isInService = i < 6;
        
        const memberService = { 
            ...service,
            counter: `Counter ${i + 1}`
        };

        return {
            id: Date.now() + i,
            ticketNumber: `A-${String(101 + i).padStart(3, '0')}`,
            name: `Customer ${i + 1}`,
            phone: `012345678${String(10 + i).padStart(2, '0')}`,
            checkInTime: checkInTime,
            estimatedServiceTime: new Date(checkInTime.getTime() + (i + 1) * service.avgTime * 60000),
            status: isInService ? 'in-service' : 'waiting',
            services: isInService ? [memberService] : [service],
            assignedTo: isInService ? (i % 4) + 2 : undefined, // Assign to mock staff
        };
    });
};


export default function QueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', createInitialQueue());
  const [serviced, setServiced] = useLocalStorage<QueueMember[]>('serviced', []);
  const [analytics, setAnalytics] = useState<any>({ // Changed AnalyticsData to any
    totalWaiting: 0,
    maxWaitTime: 0,
    averageServiceTime: 0,
    servicedCount: 0,
    feedbackReceived: 0,
  });
  const [ticketCounter, setTicketCounter] = useLocalStorage('ticketCounter', 151); // Updated counter
  const { toast } = useToast();

  const updateAnalytics = useCallback(() => {
    const waitingQueue = queue.filter(m => m.status === 'waiting');
    const servicedQueue = queue.filter(m => m.status === 'serviced');
    const totalWaiting = waitingQueue.length;
    const servicedCount = servicedQueue.length;
    
    // Include feedback from both the 'serviced' array and the main 'queue' for already-serviced members
    const feedbackReceived = [...serviced, ...servicedQueue].filter(m => m.feedback).length;

    const allServiced = [...serviced, ...servicedQueue];
    if (allServiced.length === 0) {
      setAnalytics((prev: any) => ({ // Changed prev to any
        ...prev,
        totalWaiting,
        servicedCount,
        averageServiceTime: 0,
        maxWaitTime: 0,
        feedbackReceived,
      }));
      return;
    }

    const waitTimes = allServiced.map(m =>
      Math.max(0, differenceInMinutes(new Date(m.estimatedServiceTime), new Date(m.checkInTime)))
    );
    const maxWaitTime = Math.max(...waitTimes);
    const totalServiceTime = allServiced.reduce(
      (acc, m) => acc + Math.max(0, differenceInMinutes(new Date(m.estimatedServiceTime), new Date(m.checkInTime))),
      0
    );
    const averageServiceTime = totalServiceTime / allServiced.length;

    setAnalytics({
      totalWaiting,
      servicedCount,
      averageServiceTime,
      maxWaitTime,
      feedbackReceived,
    });
  }, [queue, serviced]);


  const handleJoinQueue = (data: z.infer<typeof formSchema>) => {
    if (queue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE) {
        toast({
            title: "Queue is full",
            description: "We're sorry, the queue is currently full. Please try again later.",
            variant: 'destructive',
        });
        return;
    }
    
    // Redirect to token page for full flow
    router.push('/');
  };

  const handleEditService = (memberId: number) => {
    const member = queue.find(m => m.id === memberId);
    if (member) {
      router.push(`/service?ticketNumber=${member.ticketNumber}`);
    }
  };

  const handleSetFeedback = (memberId: number, feedback: any) => {
    setQueue(prevQueue =>
        prevQueue.map(m =>
            m.id === memberId ? { ...m, feedback } : m
        )
    );
    setServiced(prevServiced =>
        prevServiced.map(m =>
            m.id === memberId ? { ...m, feedback } : m
        )
    );
  };

  useEffect(() => {
    updateAnalytics();
  }, [queue, serviced, updateAnalytics]);

  useEffect(() => {
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
                setServiced(s => [...s, { ...member, status: 'serviced' }]);
            }
        });
        
        // 2. Fill empty counters
        const servingCounters = newQueue.filter(m => m.status === 'in-service').flatMap(m => m.services.map(s => s.counter));
        const availableCounters = Array.from({length: 6}, (_, i) => `Counter ${i+1}`).filter(c => !servingCounters.includes(c));

        const waitingQueue = newQueue.filter(m => m.status === 'waiting');
        
        if (waitingQueue.length > 0 && availableCounters.length > 0) {
          const customersToServe = Math.min(waitingQueue.length, availableCounters.length);

          for (let i = 0; i < customersToServe; i++) {
              const nextInLine = waitingQueue[i];
              const assignedCounter = availableCounters[i]; // This is a simplification
              
              newQueue = newQueue.map(member => 
                member.id === nextInLine.id 
                ? { 
                    ...member, 
                    status: 'in-service',
                    // Re-assign counter for demo purposes, a real app would have better logic
                    services: member.services.map(s => ({...s, counter: assignedCounter})),
                    estimatedServiceTime: new Date(Date.now() + member.services.reduce((acc, s) => acc + s.avgTime, 0) * 60000)
                  } 
                : member
              );

              // Notify next person
              if (waitingQueue[i+1]) {
                const upNext = waitingQueue[i+1];
                toast({
                    title: 'Your turn is next!',
                    description: `${upNext.name}, please get ready. You are next in the queue.`,
                    action: (
                      <div className="p-2 rounded-full bg-accent/80">
                          <Bell className="h-6 w-6 text-accent-foreground" />
                      </div>
                    )
                });
              }
          }
        }
        return newQueue;
      });
    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(simulation);
  }, [toast, setQueue, setServiced]);

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
          <CheckInForm onJoinQueue={handleJoinQueue} isQueueFull={queue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE}/>
          <WaitTimeCard queueLength={queue.filter(q => q.status === 'waiting').length} servicedCount={serviced.length + queue.filter(q => q.status === 'serviced').length} />
        </div>
        <div className="lg:col-span-2">
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="queue">Live Queue</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="queue" className="mt-4">
              <QueueDisplay 
                queue={queue} 
                onEditService={handleEditService} 
                onSetFeedback={handleSetFeedback} 
              />
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <AnalyticsDashboard analytics={analytics} allServiced={[...serviced, ...queue.filter(q=> q.status === 'serviced')]} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
