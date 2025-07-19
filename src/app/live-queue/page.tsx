
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as QueueService from '@/lib/queue-service';
import type { QueueMember } from '@/lib/types';
import { QueueDisplay } from '@/components/queue/QueueDisplay';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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

  // These functions are placeholders for the props, but won't be used in public view.
  const handleEditService = (memberId: number) => {
    const member = queue.find(m => m.id === memberId);
    if (member) {
      router.push(`/service?ticketNumber=${member.ticketNumber}`);
    }
  };

  const handleSetFeedback = (memberId: number, feedback: any) => {
    // In a real app, this would likely be a server action.
    // For the prototype, we'll update local storage.
    let queueList = QueueService.getQueue();
    const memberIndex = queueList.findIndex(q => q.id === memberId);
    if (memberIndex !== -1) {
      queueList[memberIndex].feedback = feedback;
      QueueService.updateQueue(queueList);
    }
    
    let servicedList = QueueService.getServiced();
    const servicedIndex = servicedList.findIndex(s => s.id === memberId);
    if (servicedIndex !== -1) {
      servicedList[servicedIndex].feedback = feedback;
      localStorage.setItem('serviced', JSON.stringify(servicedList));
    }

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
