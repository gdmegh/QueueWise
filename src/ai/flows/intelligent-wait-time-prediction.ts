// use server'

/**
 * @fileOverview Predicts wait times based on historical data and current queue status.
 *
 * - intelligentWaitTimePrediction - A function that predicts wait times.
 * - IntelligentWaitTimePredictionInput - The input type for the intelligentWaitTimePrediction function.
 * - IntelligentWaitTimePredictionOutput - The return type for the intelligentWaitTimePrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentWaitTimePredictionInputSchema = z.object({
  historicalData: z.string().describe('Historical queue data in JSON format.'),
  currentQueueStatus: z.string().describe('Current queue status in JSON format.'),
  staffAvailability: z.string().describe('Staff availability data in JSON format.'),
  serviceTypesRequested: z.string().describe('Service types requested data in JSON format.'),
});
export type IntelligentWaitTimePredictionInput = z.infer<typeof IntelligentWaitTimePredictionInputSchema>;

const IntelligentWaitTimePredictionOutputSchema = z.object({
  predictedWaitTime: z.number().describe('The predicted wait time in minutes.'),
  reasoning: z.string().describe('The reasoning behind the predicted wait time.'),
});
export type IntelligentWaitTimePredictionOutput = z.infer<typeof IntelligentWaitTimePredictionOutputSchema>;

export async function intelligentWaitTimePrediction(
  input: IntelligentWaitTimePredictionInput
): Promise<IntelligentWaitTimePredictionOutput> {
  return intelligentWaitTimePredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentWaitTimePredictionPrompt',
  input: {schema: IntelligentWaitTimePredictionInputSchema},
  output: {schema: IntelligentWaitTimePredictionOutputSchema},
  prompt: `You are an AI assistant that predicts wait times for a queue management system.

  Analyze the historical queue data, current queue status, staff availability, and service types requested to predict the wait time.

  Historical Data: {{{historicalData}}}
  Current Queue Status: {{{currentQueueStatus}}}
  Staff Availability: {{{staffAvailability}}}
  Service Types Requested: {{{serviceTypesRequested}}}

  Provide the predicted wait time in minutes and the reasoning behind the prediction.
  Ensure that the predictedWaitTime field is a number.
  `,
});

const intelligentWaitTimePredictionFlow = ai.defineFlow(
  {
    name: 'intelligentWaitTimePredictionFlow',
    inputSchema: IntelligentWaitTimePredictionInputSchema,
    outputSchema: IntelligentWaitTimePredictionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
