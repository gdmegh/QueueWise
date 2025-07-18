'use server';

import { intelligentWaitTimePrediction, IntelligentWaitTimePredictionOutput } from '@/ai/flows/intelligent-wait-time-prediction';

export async function getPredictedWaitTime(
  currentQueueLength: number,
  activeStaff: number,
  servicedToday: number
): Promise<IntelligentWaitTimePredictionOutput> {
  const mockInput = {
    historicalData: JSON.stringify([
      { day: 'Monday', peakHour: 14, avgWaitMinutes: 15 },
      { day: 'Tuesday', peakHour: 15, avgWaitMinutes: 12 },
    ]),
    currentQueueStatus: JSON.stringify({
      queueLength: currentQueueLength,
      servicedToday,
      timestamp: new Date().toISOString(),
    }),
    staffAvailability: JSON.stringify({
      activeStaff,
      totalStaff: 4,
      breaksScheduled: 1,
    }),
    serviceTypesRequested: JSON.stringify([
      { type: 'standard', count: Math.max(0, currentQueueLength - 1) },
      { type: 'complex', count: 1 },
    ]),
  };

  try {
    const result = await intelligentWaitTimePrediction(mockInput);
    // Add a bit of random variance for dynamism
    const finalPrediction = Math.max(5, result.predictedWaitTime + Math.floor(Math.random() * 5) - 2);
    return {
      ...result,
      predictedWaitTime: finalPrediction
    };
  } catch (error) {
    console.error("AI prediction failed:", error);
    // Fallback logic
    const baseWait = 5; // 5 minutes per person
    const calculatedWait = currentQueueLength > 0 ? (currentQueueLength * baseWait) / activeStaff : 0;
    return {
      predictedWaitTime: Math.round(calculatedWait),
      reasoning: "Using fallback calculation. The estimated wait is based on the number of people in the queue and available staff."
    };
  }
}
