'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { differenceInMinutes } from 'date-fns';

import { CheckInForm } from '@/components/CheckInForm';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import type { QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Ticket } from 'lucide-react';

const formSchema = z.object({
  phone: z.string().regex(/^\d{10}$/),
});

const MAX_QUEUE_SIZE = 20;

export default function TokenPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const [serviced, setServiced] = useState<QueueMember[]>([]);
  const [ticketCounter, setTicketCounter] = useState(1);
  const { toast } = useToast();

  // In a real app, this state would be shared or fetched from a backend.
  // For this prototype, we'll manage a simplified version of the queue
  // state here to enable the CheckInForm and WaitTimeCard to function.
  // The full queue is visible on the /queue page.

  const handleJoinQueue = (data: z.infer<typeof formSchema>) => {
    if (queue.length >= MAX_QUEUE_SIZE) {
        toast({
            title: "Queue is full",
            description: "We're sorry, the queue is currently full. Please try again later.",
            variant: 'destructive',
        });
        return;
    }

    const newMember: QueueMember = {
      id: Date.now(),
      ticketNumber: `A-${String(ticketCounter).padStart(3, '0')}`,
      name: `Guest (****${data.phone.slice(-4)})`,
      phone: data.phone,
      checkInTime: new Date(),
      estimatedServiceTime: new Date(), // This would be calculated in a real scenario
      status: 'waiting',
    };

    setQueue(prevQueue => [...prevQueue, newMember]);
    setTicketCounter(prev => prev + 1);

    toast({
        title: "You have a token!",
        description: `Your ticket is ${newMember.ticketNumber}. You will be redirected to the live queue.`,
    });
    
    // In a real application, you'd likely persist this new queue member
    // to your backend database here.

    // Redirect to the queue page after a short delay
    setTimeout(() => {
        router.push('/queue');
    }, 2000);
  };

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="max-w-md mx-auto space-y-8">
         <div className="text-center">
            <Ticket className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary mt-4">Get Your Queue Token</h1>
            <p className="text-muted-foreground mt-2">Enter your phone number to secure your spot in line.</p>
         </div>
         <CheckInForm onJoinQueue={handleJoinQueue} isQueueFull={queue.length >= MAX_QUEUE_SIZE}/>
         <WaitTimeCard queueLength={queue.length} servicedCount={serviced.length} />
       </div>
    </main>
  );
}
