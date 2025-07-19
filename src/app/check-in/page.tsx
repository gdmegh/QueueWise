
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { QueueMember } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import * as db from '@/lib/database';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

export default function CheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const [currentMember, setCurrentMember] = useState<QueueMember | null>(null);
  const ticketNumber = searchParams.get('ticketNumber');
  
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '' },
  });
  
  useEffect(() => {
    const currentQueue = db.getData<QueueMember[]>('queue');
    setQueue(currentQueue);

    if (ticketNumber) {
      const member = currentQueue.find(m => m.ticketNumber === ticketNumber);
      if (member) {
        setCurrentMember(member);
        profileForm.setValue('name', member.name === 'Guest User' ? '' : member.name);
      } else {
        toast({ title: "Invalid Ticket", description: "Could not find a user with that ticket number.", variant: 'destructive' });
        router.push('/');
      }
    } else {
      router.push('/'); // No ticket, no business here.
    }
  }, [ticketNumber, router, toast, profileForm]);

  const handleSetProfile = (data: z.infer<typeof profileFormSchema>) => {
    if (!currentMember) return;

    const updatedQueue = queue.map(m => 
      m.id === currentMember.id ? { ...m, name: data.name } : m
    );
    db.setData('queue', updatedQueue);
    
    toast({
      title: `Welcome, ${data.name}!`,
      description: `Your ticket is ${currentMember.ticketNumber}.`,
    });

    router.push(`/service?ticketNumber=${currentMember.ticketNumber}`);
  };

  if (!currentMember) {
     return (
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
            <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary text-center">
                    Enter Your Name
                </CardTitle>
                    <CardDescription className="text-center">Please provide your name to continue your check-in.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleSetProfile)} className="space-y-4">
                        <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g. Jane Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Confirm Name & Select Service</Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
    </main>
  );
}
