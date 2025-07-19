
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
import * as db from '@/lib/database';

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
      m.checkInTime && m.services[0]?.startTime ? Math.max(0, differenceInMinutes(new Date(m.services[0].startTime), new Date(m.checkInTime))) : 0
    );
    const maxWaitTime = Math.max(...waitTimes);

    const serviceTimes = allServiced.flatMap(m => m.services).map(s => 
      s.startTime && s.endTime ? Math.max(0, differenceInMinutes(new Date(s.endTime), new Date(s.startTime))) : 0
    );
    const totalServiceTime = serviceTimes.reduce((acc, time) => acc + time, 0);
    const averageServiceTime = serviceTimes.length > 0 ? totalServiceTime / serviceTimes.length : 0;

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
    db.updateMemberFeedback(memberId, feedback);
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
