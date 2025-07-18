'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { QueueMember } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Smile, Meh, Frown, Send } from 'lucide-react';

const feedbackFormSchema = z.object({
  rating: z.enum(["excellent", "good", "fair", "poor"]),
  comments: z.string().optional(),
});

interface FeedbackFormProps {
  member: QueueMember;
}

export function FeedbackForm({ member }: FeedbackFormProps) {
  const { toast } = useToast();
  const [serviced, setServiced] = useLocalStorage<QueueMember[]>('serviced', []);

  const form = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
  });

  const onSubmit = (data: z.infer<typeof feedbackFormSchema>) => {
    setServiced(prev => prev.map(m => m.id === member.id ? { ...m, feedback: data } : m));
    toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve our service."
    });
  };

  const ratingIcons: { [key: string]: React.ReactNode } = {
    excellent: <Smile className="h-6 w-6 text-green-500" />,
    good: <Smile className="h-6 w-6 text-yellow-500" />,
    fair: <Meh className="h-6 w-6 text-orange-500" />,
    poor: <Frown className="h-6 w-6 text-red-500" />,
  };

  return (
    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Star className="text-primary"/> How was your experience?</CardTitle>
        <CardDescription>Your feedback helps us improve.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Overall Satisfaction</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex justify-around items-center pt-2"
                    >
                      {Object.keys(ratingIcons).map(rating => (
                        <FormItem key={rating} className="flex flex-col items-center space-y-1">
                          <FormControl>
                            <RadioGroupItem value={rating} className="sr-only"/>
                          </FormControl>
                          <FormLabel className={`cursor-pointer rounded-full p-3 border-2 ${field.value === rating ? 'border-primary bg-primary/20' : 'border-transparent'}`}>
                             {ratingIcons[rating]}
                          </FormLabel>
                          <span className="text-xs capitalize">{rating}</span>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us more about your experience..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              <Send /> Submit Feedback
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
