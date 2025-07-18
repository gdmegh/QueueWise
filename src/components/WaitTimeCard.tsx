'use client';

import { useState, useEffect, type FC } from 'react';
import { BrainCircuit, Hourglass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { IntelligentWaitTimePredictionOutput } from '@/ai/flows/intelligent-wait-time-prediction';
import { getPredictedWaitTime } from '@/app/actions';

interface WaitTimeCardProps {
  queueLength: number;
  servicedCount: number;
}

export const WaitTimeCard: FC<WaitTimeCardProps> = ({ queueLength, servicedCount }) => {
  const [prediction, setPrediction] = useState<IntelligentWaitTimePredictionOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      setIsLoading(true);
      // Let's assume 2 active staff members for this simulation
      const result = await getPredictedWaitTime(queueLength, 2, servicedCount);
      setPrediction(result);
      setIsLoading(false);
    };

    fetchPrediction();
    // Refetch every 30 seconds or when queue length changes
    const interval = setInterval(fetchPrediction, 30000);
    return () => clearInterval(interval);
  }, [queueLength, servicedCount]);

  return (
    <Card className="bg-card/90 border-primary/10 shadow-lg backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-headline">Estimated Wait Time</CardTitle>
        <Hourglass className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <div className="text-5xl font-bold text-primary">
              {prediction?.predictedWaitTime ?? 'N/A'}{' '}
              <span className="text-2xl font-medium text-muted-foreground">min</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex items-start space-x-2">
              <BrainCircuit className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
              <p>
                <span className="font-semibold">AI Insight:</span> {prediction?.reasoning}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
