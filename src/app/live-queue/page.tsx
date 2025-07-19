
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as QueueService from '@/lib/queue-service';
import type { QueueMember } from '@/lib/types';
import { QueueDisplay } from '@/components/queue/QueueDisplay';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import * as db from '@/lib/database';

const REFRESH_INTERVAL_MS = 5000;

export default function LiveQueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const { toast } = useToast();

  const refreshData = useCallback(() => {
    const currentQueue = QueueService.getQueue();
    setQueue(currentQueue);
  }, []);

  useEffect(() => {
    refreshData();
    const intervalId = setInterval(() => {
      QueueService.runQueueSimulation();
      refreshData();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshData]);

  const handleEditService = (memberId: number) => {
    const member = queue.find(m => m.id === memberId);
    if (member) {
      router.push(`/service?ticketNumber=${member.ticketNumber}`);
    }
  };

  const handleSetFeedback = (memberId: number, feedback: any) => {
    db.updateMemberFeedback(memberId, feedback);
    refreshData();
    toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve our service."
    });
  };

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <QueueDisplay 
          queue={queue} 
          onEditService={handleEditService} 
          onSetFeedback={handleSetFeedback}
          isPublicView={true}
        />
    </main>
  );
}
