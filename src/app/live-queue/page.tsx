

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
import * as QueueService from '@/lib/queue-service';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  phone: z.string().regex(/^\d{11}$/, { message: 'Please enter a valid 11-digit phone number.' }),
});

const MAX_QUEUE_SIZE = 100;
const REFRESH_INTERVAL_MS = 5000;


export default function QueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const [serviced, setServiced] = useState<QueueMember[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalWaiting: 0,
    maxWaitTime: 0,
    averageServiceTime: 0,
    servicedCount: 0,
    feedbackReceived: 0,
  });
  const { toast } = useToast();

  const refreshData = useCallback(() => {
    const currentQueue = QueueService.getQueue();
    const currentServiced = QueueService.getServiced();
    setQueue(currentQueue);
    setServiced(currentServiced);
    updateAnalytics(currentQueue, currentServiced);
  }, []);
  
  const updateAnalytics = useCallback((currentQueue: QueueMember[], currentServiced: QueueMember[]) => {
    const waitingQueue = currentQueue.filter(m => m.status === 'waiting');
    const totalWaiting = waitingQueue.length;
    
    // Combine already serviced from the dedicated list and any in the queue marked as serviced
    const allServiced = [...currentServiced, ...currentQueue.filter(m => m.status === 'serviced')];
    const servicedCount = allServiced.length;
    const feedbackReceived = allServiced.filter(m => m.feedback).length;

    if (allServiced.length === 0) {
      setAnalytics({
        totalWaiting,
        servicedCount,
        averageServiceTime: 0,
        maxWaitTime: 0,
        feedbackReceived,
      });
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
  }, []);


  const handleJoinQueue = (data: z.infer<typeof formSchema>) => {
    if (queue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE) {
        toast({
            title: "Queue is full",
            description: "We're sorry, the queue is currently full. Please try again later.",
            variant: 'destructive',
        });
        return;
    }
    
    // Redirect to home page for the full guest check-in flow
    router.push('/');
  };

  const handleEditService = (memberId: number) => {
    const member = queue.find(m => m.id === memberId);
    if (member) {
      router.push(`/service?ticketNumber=${member.ticketNumber}`);
    }
  };

  const handleSetFeedback = (memberId: number, feedback: any) => {
    const allMembers = [...QueueService.getQueue(), ...QueueService.getServiced()];
    const member = allMembers.find(m => m.id === memberId);
    
    if (member) {
        member.feedback = feedback;
        
        // Update in queue if it exists there
        let queueList = QueueService.getQueue();
        const queueIndex = queueList.findIndex(q => q.id === memberId);
        if (queueIndex > -1) {
            queueList[queueIndex] = member;
            QueueService.updateQueue(queueList);
        }

        // Update in serviced list if it exists there
        let servicedList = QueueService.getServiced();
        const servicedIndex = servicedList.findIndex(s => s.id === memberId);
        if (servicedIndex > -1) {
            servicedList[servicedIndex] = member;
            QueueService.addAllToServiced(servicedList.filter((_,i) => i !== servicedIndex)); // Bit of a hack to replace
        }
    }
    refreshData();
  };

  useEffect(() => {
    refreshData();
    const intervalId = setInterval(refreshData, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshData]);
  
  useEffect(() => {
     // The simulation is now external in queue-service, so we just need to refresh
    const simulationId = setInterval(() => {
        const { newlyServiced } = QueueService.runQueueSimulation();
        if (newlyServiced.length > 0) {
            // Check for who is next after the newly serviced person
            const waiting = QueueService.getQueue().filter(q => q.status === 'waiting');
            if (waiting.length > 0) {
                 const nextInLine = waiting.sort((a,b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime())[0];
                 toast({
                    title: 'Your turn is next!',
                    description: `${nextInLine.name}, please get ready. You are next in the queue.`,
                    action: (
                      <div className="p-2 rounded-full bg-accent/80">
                          <Bell className="h-6 w-6 text-accent-foreground" />
                      </div>
                    )
                });
            }
        }
        refreshData();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(simulationId);
  }, [refreshData, toast]);


  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
          <CheckInForm onJoinQueue={handleJoinQueue} isQueueFull={queue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE}/>
          <WaitTimeCard queueLength={analytics.totalWaiting} servicedCount={analytics.servicedCount} />
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
