'use server';
/**
 * @fileOverview Recommends a service based on user input.
 *
 * - recommendService - A function that recommends a service.
 * - ServiceRecommendationInput - The input type for the recommendService function.
 * - ServiceRecommendationOutput - The return type for the recommendService function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { services } from '@/lib/services';

const serviceNames = services.map(s => s.name) as [string, ...string[]];

const ServiceRecommendationInputSchema = z.object({
  issueDescription: z.string().describe('The user\'s description of their issue or what they need help with.'),
});
export type ServiceRecommendationInput = z.infer<typeof ServiceRecommendationInputSchema>;

const ServiceRecommendationOutputSchema = z.object({
  serviceName: z.enum(serviceNames).describe('The recommended service name.'),
  reasoning: z.string().describe('A brief explanation for why this service was recommended.'),
});
export type ServiceRecommendationOutput = z.infer<typeof ServiceRecommendationOutputSchema>;

export async function recommendService(
  input: ServiceRecommendationInput
): Promise<ServiceRecommendationOutput> {
  return serviceRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'serviceRecommendationPrompt',
  input: {schema: ServiceRecommendationInputSchema},
  output: {schema: ServiceRecommendationOutputSchema},
  prompt: `You are an expert at understanding customer needs at a financial institution. Based on the user's issue description, recommend the most appropriate service.

Available services:
- General Inquiry: For general questions, account information, etc.
- New Account: For opening a new bank account.
- Deposit/Withdrawal: For simple cash or check transactions.
- Loan Application: For inquiries and applications related to personal or business loans.

User's issue: "{{{issueDescription}}}"

Recommend a service from the available list and provide a short reason for your recommendation.
`,
});

const serviceRecommendationFlow = ai.defineFlow(
  {
    name: 'serviceRecommendationFlow',
    inputSchema: ServiceRecommendationInputSchema,
    outputSchema: ServiceRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
