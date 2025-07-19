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

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, PlusCircle, Trash2, Banknote, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const serviceFormSchema = z.object({
  category: z.string().min(1, 'Please select a category.'),
  service: z.string().min(1, 'Please select a service.'),
  subService: z.string().optional(),
  description: z.string().optional(),
});

const serviceIcons: { [key: string]: React.ReactNode } = {
  'Account Services': <Banknote className="h-4 w-4" />,
  'Card Services': <Banknote className="h-4 w-4" />,
  'General Inquiry': <List className="h-4 w-4" />,
  // Add more icons as needed
};

export default function ServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
  const [currentMember, setCurrentMember] = useState<QueueMember | null>(null);
  const [selectedServices, setSelectedServices] = useState<SubService[]>([]);
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
        setSelectedServices(member.services || []);
      } else {
        toast({ title: "Invalid Ticket", description: "Could not find a user with that ticket number.", variant: 'destructive' });
        router.push('/');
      }
    } else {
        toast({ title: "Ticket Number Required", description: "No ticket number provided in the URL.", variant: 'destructive' });
        router.push('/token');
    }
  }, [ticketNumber, queue, router, toast]);

  const onAddService = (data: z.infer<typeof serviceFormSchema>) => {
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
    
    // Add description to service if provided
    const serviceToAdd = {
        ...finalService,
        description: data.description,
    };

    setSelectedServices(prev => [...prev, serviceToAdd]);
    form.reset();
  };

  const onRemoveService = (serviceIndex: number) => {
    setSelectedServices(prev => prev.filter((_, index) => index !== serviceIndex));
  };
  
  const onConfirmServices = () => {
      if (!currentMember || selectedServices.length === 0) {
        toast({ title: "No Services Selected", description: "Please add at least one service.", variant: "destructive" });
        return;
      }
      
      const totalAvgTime = selectedServices.reduce((acc, s) => acc + s.avgTime, 0);

      setQueue(prevQueue => {
        const userIndex = prevQueue.findIndex(m => m.id === currentMember.id);
        
        const lastPersonInQueue = prevQueue[prevQueue.length - 1];
        const estimatedServiceTime = new Date(
            (lastPersonInQueue ? new Date(lastPersonInQueue.estimatedServiceTime).getTime() : Date.now()) +
            totalAvgTime * 60000
        );
          
        const updatedMember = {
            ...currentMember,
            services: selectedServices,
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
        title: "Services Confirmed!",
        description: `You are now in the queue.`,
      });

      router.push('/');
  }

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
              Please select the service(s) you need today. You can add multiple services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddService)} className="space-y-4">
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
                <Button type="submit" variant="outline" className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                </Button>
              </form>
            </Form>
            
            {selectedServices.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-foreground mb-2">Your Selected Services:</h3>
                    <ul className="space-y-2">
                        {selectedServices.map((service, index) => (
                            <li key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <div className="flex items-center gap-2">
                                  {serviceIcons[service.name] || <List className="h-4 w-4" />}
                                  <span>{service.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onRemoveService(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </CardContent>
           {selectedServices.length > 0 && (
                <CardFooter>
                    <Button onClick={onConfirmServices} className="w-full">
                        Confirm Services & Join Queue <ArrowRight className="ml-2"/>
                    </Button>
                </CardFooter>
            )}
        </Card>
      </div>
    </main>
  );
}
