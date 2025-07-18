'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { differenceInMinutes } from 'date-fns';

import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { CheckInForm } from '@/components/CheckInForm';
import { Header } from '@/components/Header';
import { QueueDisplay } from '@/components/QueueDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import type { AnalyticsData, QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\d{10}$/),
});

const MAX_QUEUE_SIZE = 20;
const AVG_SERVICE_TIME_MINS = 5; // Average service time in minutes
const SIMULATION_INTERVAL_MS = 20000; // 20 seconds for simulation

export default function Home() {
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const [serviced, setServiced] = useState<QueueMember[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalWaiting: 0,
    maxWaitTime: 0,
    averageServiceTime: 0,
    servicedCount: 0,
  });
  const [ticketCounter, setTicketCounter] = useState(1);
  const { toast } = useToast();

  const updateAnalytics = useCallback(() => {
    const totalWaiting = queue.length;
    const servicedCount = serviced.length;
    if (servicedCount === 0) {
      setAnalytics(prev => ({
        ...prev,
        totalWaiting,
        servicedCount,
        averageServiceTime: 0,
        maxWaitTime: 0,
      }));
      return;
    }

    const waitTimes = serviced.map(m =>
      Math.max(0, differenceInMinutes(m.estimatedServiceTime, m.checkInTime))
    );
    const maxWaitTime = Math.max(...waitTimes);
    const totalServiceTime = serviced.reduce(
      (acc, m) => acc + Math.max(0, differenceInMinutes(m.estimatedServiceTime, m.checkInTime)),
      0
    );
    const averageServiceTime = totalServiceTime / servicedCount;

    setAnalytics({
      totalWaiting,
      servicedCount,
      averageServiceTime,
      maxWaitTime,
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

    const lastPerson = queue[queue.length - 1];
    const estimatedServiceTime = new Date(
      (lastPerson ? lastPerson.estimatedServiceTime.getTime() : Date.now()) +
        AVG_SERVICE_TIME_MINS * 60000
    );

    const newMember: QueueMember = {
      id: Date.now(),
      ticketNumber: `A-${String(ticketCounter).padStart(3, '0')}`,
      name: data.name,
      phone: data.phone,
      checkInTime: new Date(),
      estimatedServiceTime,
      status: 'waiting',
    };

    setQueue(prevQueue => [...prevQueue, newMember]);
    setTicketCounter(prev => prev + 1);

    toast({
        title: "You're in the queue!",
        description: `Your ticket number is ${newMember.ticketNumber}. Estimated wait is about ${Math.max(0, differenceInMinutes(estimatedServiceTime, new Date()))} minutes.`,
    });
  };

  useEffect(() => {
    updateAnalytics();
  }, [queue, serviced, updateAnalytics]);

  useEffect(() => {
    const simulation = setInterval(() => {
      if (queue.length > 0) {
        setQueue(prevQueue => {
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
        });
      }
    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(simulation);
  }, [queue, toast]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
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
                <QueueDisplay queue={queue} />
              </TabsContent>
              <TabsContent value="analytics" className="mt-4">
                <AnalyticsDashboard analytics={analytics} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
