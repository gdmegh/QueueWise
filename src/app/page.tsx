
'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { differenceInMinutes } from 'date-fns';

import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { CheckInForm } from '@/components/CheckInForm';
import { QueueDisplay } from '@/components/QueueDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import type { AnalyticsData, QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Bell, Edit } from 'lucide-react';
import { services } from '@/lib/services';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  phone: z.string().regex(/^\d{11}$/, { message: 'Please enter a valid 11-digit phone number.' }),
});

const MAX_QUEUE_SIZE = 20;
const SIMULATION_INTERVAL_MS = 20000; // 20 seconds for simulation

const createInitialQueue = (): QueueMember[] => {
    const now = new Date();
    return Array.from({ length: 10 }, (_, i) => {
        const checkInTime = new Date(now.getTime() - (10 - i) * 5 * 60000); // Staggered check-in times
        const service = services[i % services.length];
        return {
            id: Date.now() + i,
            ticketNumber: `A-${String(101 + i).padStart(3, '0')}`,
            name: `Customer ${i + 1}`,
            phone: `012345678${String(10 + i).padStart(2, '0')}`,
            checkInTime: checkInTime,
            estimatedServiceTime: new Date(checkInTime.getTime() + (i + 1) * service.avgTime * 60000),
            status: 'waiting',
            service: service.name,
            assignedTo: i < 3 ? 2 : undefined, // Assign first 3 to mock staff
        };
    });
};


export default function QueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', createInitialQueue());
  const [serviced, setServiced] = useLocalStorage<QueueMember[]>('serviced', []);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalWaiting: 0,
    maxWaitTime: 0,
    averageServiceTime: 0,
    servicedCount: 0,
    feedbackReceived: 0,
  });
  const [ticketCounter, setTicketCounter] = useLocalStorage('ticketCounter', 111);
  const { toast } = useToast();

  const updateAnalytics = useCallback(() => {
    const totalWaiting = queue.length;
    const servicedCount = serviced.length;
    const feedbackReceived = serviced.filter(m => m.feedback).length;

    if (servicedCount === 0) {
      setAnalytics(prev => ({
        ...prev,
        totalWaiting,
        servicedCount,
        averageServiceTime: 0,
        maxWaitTime: 0,
        feedbackReceived,
      }));
      return;
    }

    const waitTimes = serviced.map(m =>
      Math.max(0, differenceInMinutes(new Date(m.estimatedServiceTime), new Date(m.checkInTime)))
    );
    const maxWaitTime = Math.max(...waitTimes);
    const totalServiceTime = serviced.reduce(
      (acc, m) => acc + Math.max(0, differenceInMinutes(new Date(m.estimatedServiceTime), new Date(m.checkInTime))),
      0
    );
    const averageServiceTime = totalServiceTime / servicedCount;

    setAnalytics({
      totalWaiting,
      servicedCount,
      averageServiceTime,
      maxWaitTime,
      feedbackReceived,
    });
  }, [queue.length, serviced]);


  const handleJoinQueue = (data: z.infer<typeof formSchema>) => {
    if (queue.length >= MAX_QUEUE_SIZE) {
        toast({
            title: "Queue is full",
            description: "We're sorry, the queue is currently full. Please try again later.",
            variant: 'destructive',
        });
        return;
    }
    
    // Redirect to token page for full flow
    router.push('/token');
  };

  const handleEditService = (memberId: number) => {
    const member = queue.find(m => m.id === memberId);
    if (member) {
      router.push(`/service?ticketNumber=${member.ticketNumber}`);
    }
  };

  useEffect(() => {
    updateAnalytics();
  }, [queue, serviced, updateAnalytics]);

  useEffect(() => {
    const simulation = setInterval(() => {
      setQueue(prevQueue => {
        if (prevQueue.length > 0) {
          const nextInLine = prevQueue[0];
          
          if(prevQueue.length > 1) {
            const upNext = prevQueue[1];
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

          setServiced(prevServiced => [...prevServiced, { ...nextInLine, status: 'serviced' }]);
          return prevQueue.slice(1);
        }
        return prevQueue;
      });
    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(simulation);
  }, [toast, setQueue, setServiced]);

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
          <CheckInForm onJoinQueue={handleJoinQueue} isQueueFull={queue.length >= MAX_QUEUE_SIZE}/>
          <WaitTimeCard queueLength={queue.length} servicedCount={serviced.length} />
        </div>
        <div className="lg:col-span-2">
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="queue">Live Queue</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="queue" className="mt-4">
              <QueueDisplay queue={queue} onEditService={handleEditService} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <AnalyticsDashboard analytics={analytics} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
