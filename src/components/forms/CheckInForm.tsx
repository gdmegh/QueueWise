
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mic, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  phone: z.string().regex(/^\d{10,15}$/, { message: 'Please enter a valid phone number.' }),
});

interface CheckInFormProps {
  onJoinQueue: (data: z.infer<typeof formSchema>) => void;
  isQueueFull: boolean;
}

export function CheckInForm({ onJoinQueue, isQueueFull }: CheckInFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onJoinQueue(values);
    form.reset();
  }

  function handleVoiceCheckIn() {
    toast({
      title: 'Voice Check-in',
      description: 'Voice interaction is not yet implemented. Please use the form to check in.',
      variant: 'default',
    });
  }

  return (
    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Join the Queue</CardTitle>
        <CardDescription>Enter your phone number to get a spot in the line.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (for SMS alerts)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="01234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={isQueueFull}>
                <UserPlus /> Join Queue
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleVoiceCheckIn}>
                <Mic /> Join with Voice
              </Button>
            </div>
             {isQueueFull && <p className="text-sm text-destructive text-center pt-2">The queue is currently full. Please try again later.</p>}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
