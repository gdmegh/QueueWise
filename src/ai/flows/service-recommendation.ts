'use server';
/**
 * @fileOverview Recommends a service based on user input for a clinic.
 *
 * - recommendService - A function that recommends a service.
 * - ServiceRecommendationInput - The input type for the recommendService function.
 * - ServiceRecommendationOutput - The return type for the recommendService function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { services } from '@/lib/services';

const serviceNames = services.flatMap(s => s.subServices.flatMap(sub => sub.subServices ? sub.subServices.map(ss => ss.name) : sub.name)) as [string, ...string[]];

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
  prompt: `You are an expert at understanding patient needs at a medical clinic. Based on the user's issue description, recommend the most appropriate service.

Available services:
- General Physician: For general check-ups, cough, flu, etc.
- Specialist Consultation (Cardiology, Dermatology, Pediatrics): For specific issues requiring a specialist.
- Blood Test: For lab work involving blood samples.
- X-Ray / Ultrasound: For medical imaging.
- Prescription Pickup / Over-the-counter: For collecting medication.
- Annual Physical / Vaccination: For preventative care and immunizations.

User's issue: "{{{issueDescription}}}"

Recommend a specific service from the available list and provide a short reason for your recommendation.
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
