
'use client';

import { useState, useEffect, useCallback } from 'react';
import { differenceInMinutes } from 'date-fns';

import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { QueueDisplay } from '@/components/queue/QueueDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WaitTimeCard } from '@/components/queue/WaitTimeCard';
import type { QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import * as QueueService from '@/lib/queue-service';
import { useRouter } from 'next/navigation';

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
        
        let queueList = QueueService.getQueue();
        const queueIndex = queueList.findIndex(q => q.id === memberId);
        if (queueIndex > -1) {
            queueList[queueIndex] = member;
            QueueService.updateQueue(queueList);
        }

        let servicedList = QueueService.getServiced();
        const servicedIndex = servicedList.findIndex(s => s.id === memberId);
        if (servicedIndex > -1) {
            const newServicedList = servicedList.map(s => s.id === memberId ? member : s);
            localStorage.setItem('serviced', JSON.stringify(newServicedList));
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
    const simulationId = setInterval(() => {
        const { newlyServiced } = QueueService.runQueueSimulation();
        if (newlyServiced.length > 0) {
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
      <div className="space-y-8">
        <WaitTimeCard queueLength={analytics.totalWaiting} servicedCount={analytics.servicedCount} />
        
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
              isPublicView={false}
            />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <AnalyticsDashboard analytics={analytics} allServiced={[...serviced, ...queue.filter(q=> q.status === 'serviced')]} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
