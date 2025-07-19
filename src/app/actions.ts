'use server';

import { intelligentWaitTimePrediction, IntelligentWaitTimePredictionOutput } from '@/ai/flows/intelligent-wait-time-prediction';
import { recommendService, ServiceRecommendationOutput } from '@/ai/flows/service-recommendation';
import * as db from '@/lib/database';
import { revalidatePath } from 'next/cache';

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

export async function getServiceRecommendation(issueDescription: string): Promise<ServiceRecommendationOutput> {
  try {
    const result = await recommendService({ issueDescription });
    return result;
  } catch (error) {
    console.error("AI service recommendation failed:", error);
    // Fallback to general inquiry
    return {
      serviceName: 'General Physician',
      reasoning: "Could not determine the specific service needed. Please clarify your request at the counter."
    };
  }
}

/**
 * This is an example of a server-side function (a "Server Action").
 * When you connect a database, you would replace the call to `db.addCompany`
 * with your MongoDB logic here. This function is secure because it only
 * runs on the server.
 */
export async function createCompanyAction(name: string, plan: 'Enterprise' | 'Business' | 'Trial') {
  // Database logic would go here.
  // For now, it calls our abstracted database service.
  const newCompany = {
    id: `comp-${Date.now()}`,
    name: name,
    plan: plan,
    status: plan === 'Trial' ? 'trial' : 'active',
    users: 0,
  };
  
  try {
    db.addCompany(newCompany);
    // This tells Next.js to refresh the data on the super-admin page
    revalidatePath('/super-admin'); 
    return { success: true, message: 'Company created successfully!' };
  } catch (e) {
    return { success: false, message: 'Failed to create company.' };
  }
}
