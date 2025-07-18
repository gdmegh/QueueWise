'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { QueueMember } from '@/lib/types';
import { services, Service } from '@/lib/services';
import { getServiceRecommendation } from '@/app/actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';

const serviceFormSchema = z.object({
  issueDescription: z.string().min(10, { message: 'Please describe your issue in at least 10 characters.' }),
});

export default function ServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
  const [currentMember, setCurrentMember] = useState<QueueMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{ serviceName: string; reasoning: string } | null>(null);
  const ticketNumber = searchParams.get('ticketNumber');

  const form = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      issueDescription: '',
    },
  });

  useEffect(() => {
    if (ticketNumber) {
      const member = queue.find(m => m.ticketNumber === ticketNumber);
      if (member) {
        setCurrentMember(member);
      } else {
        toast({ title: "Invalid Ticket", description: "Could not find a user with that ticket number.", variant: 'destructive' });
        router.push('/');
      }
    } else {
        toast({ title: "Ticket Number Required", description: "No ticket number provided in the URL.", variant: 'destructive' });
        router.push('/token');
    }
  }, [ticketNumber, queue, router, toast]);

  const handleGetServiceRecommendation = async (data: z.infer<typeof serviceFormSchema>) => {
    setIsLoading(true);
    const result = await getServiceRecommendation(data.issueDescription);
    setRecommendation(result);
    setIsLoading(false);
  };
  
  const confirmService = () => {
    if (!currentMember || !recommendation) return;

    const service = services.find(s => s.name === recommendation.serviceName) || services[0];
    
    setQueue(prevQueue => {
      // Find if user is already in queue (editing service) or new
      const userIndex = prevQueue.findIndex(m => m.id === currentMember.id);
      
      const lastPersonInQueue = prevQueue[prevQueue.length - 1];
      const estimatedServiceTime = new Date(
        (lastPersonInQueue ? new Date(lastPersonInQueue.estimatedServiceTime).getTime() : Date.now()) +
        service.avgTime * 60000
      );
        
      const updatedMember = {
        ...currentMember,
        service: service.name,
        estimatedServiceTime,
      };

      if(userIndex > -1) {
        // User is editing, update their details
        const newQueue = [...prevQueue];
        newQueue[userIndex] = updatedMember;
        return newQueue;
      } else {
        // New user, add to queue
        return [...prevQueue, updatedMember];
      }
    });

    toast({
      title: "Service Confirmed!",
      description: `You are now in the queue for ${service.name}. Go to ${service.counter}.`,
    });

    router.push('/');
  };

  if (!currentMember) {
    return (
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary text-center">
              Hello, {currentMember.name}!
            </CardTitle>
            <div className="text-center text-muted-foreground">Your Ticket: <span className="font-bold text-lg text-primary">{currentMember.ticketNumber}</span></div>
            <CardDescription className="text-center pt-2">
              To help us direct you to the right person, please describe what you need assistance with today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!recommendation ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGetServiceRecommendation)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="issueDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How can we help you?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., 'I would like to open a savings account' or 'I lost my debit card and need a new one.'" {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    Get Service Recommendation
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Our AI Recommends:</h3>
                <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{recommendation.serviceName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{recommendation.reasoning}</p>
                </div>
                <p className="text-sm text-muted-foreground">Does this look correct?</p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={confirmService} className="w-full">Confirm and Join Queue</Button>
                    <Button variant="outline" onClick={() => setRecommendation(null)} className="w-full">Try Again</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
