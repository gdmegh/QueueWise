'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { QueueMember } from '@/lib/types';
import { services as serviceCategories, SubService } from '@/lib/services';
import { getServiceRecommendation } from '@/app/actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';

const serviceFormSchema = z.object({
  category: z.string().min(1, 'Please select a category.'),
  service: z.string().min(1, 'Please select a service.'),
  subService: z.string().optional(),
  description: z.string().optional(),
});

export default function ServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
  const [currentMember, setCurrentMember] = useState<QueueMember | null>(null);
  const ticketNumber = searchParams.get('ticketNumber');

  const form = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      category: '',
      service: '',
      subService: '',
      description: '',
    },
  });

  const category = form.watch('category');
  const serviceName = form.watch('service');

  const selectedCategory = serviceCategories.find(c => c.name === category);
  const selectedService = selectedCategory?.subServices.find(s => s.name === serviceName);
  const subServices = selectedService?.subServices;
  const needsDescription = selectedService?.needsDescription;

  useEffect(() => {
    form.setValue('service', '');
    form.setValue('subService', '');
  }, [category, form]);

  useEffect(() => {
    form.setValue('subService', '');
  }, [serviceName, form]);

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

  const onSubmit = (data: z.infer<typeof serviceFormSchema>) => {
    if (!currentMember) return;
    
    let finalService: SubService | undefined;
    if (data.subService) {
        finalService = selectedService?.subServices?.find(ss => ss.name === data.subService);
    } else {
        finalService = selectedService;
    }

    if (!finalService) {
        toast({ title: "Invalid Service", description: "Please complete your service selection.", variant: "destructive" });
        return;
    }

    const { name, avgTime, counter } = finalService;
    
    setQueue(prevQueue => {
      const userIndex = prevQueue.findIndex(m => m.id === currentMember.id);
      
      const lastPersonInQueue = prevQueue[prevQueue.length - 1];
      const estimatedServiceTime = new Date(
        (lastPersonInQueue ? new Date(lastPersonInQueue.estimatedServiceTime).getTime() : Date.now()) +
        avgTime * 60000
      );
        
      const updatedMember = {
        ...currentMember,
        service: name,
        serviceNotes: data.description,
        estimatedServiceTime,
      };

      if(userIndex > -1) {
        const newQueue = [...prevQueue];
        newQueue[userIndex] = updatedMember;
        return newQueue;
      } else {
        return [...prevQueue, updatedMember];
      }
    });

    toast({
      title: "Service Confirmed!",
      description: `You are now in the queue for ${name}. Please go to ${counter}.`,
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
              Please select the service you need today. This will help us direct you to the right person.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceCategories.map(cat => <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedCategory && (
                  <FormField
                    control={form.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedCategory.subServices.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {subServices && (
                  <FormField
                    control={form.control}
                    name="subService"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Request</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a specific request..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subServices.map(ss => <SelectItem key={ss.name} value={ss.name}>{ss.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {needsDescription && !subServices && (
                   <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Details</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Please provide more details about your inquiry..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full">
                  Confirm Service & Join Queue <ArrowRight className="ml-2"/>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
