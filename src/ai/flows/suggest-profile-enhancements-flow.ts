
'use server';
/**
 * @fileOverview An AI flow to suggest profile enhancements (bio, skills) for a developer
 * based on their GitHub profile.
 *
 * - suggestProfileEnhancements - A function that calls the AI flow.
 * - SuggestProfileEnhancementsInput - The input type.
 * - SuggestProfileEnhancementsOutput - The output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProfileEnhancementsInputSchema = z.object({
  githubProfileUrl: z
    .string()
    .describe('The URL of the developer\'s GitHub profile.'),
});
export type SuggestProfileEnhancementsInput = z.infer<typeof SuggestProfileEnhancementsInputSchema>;

const SuggestProfileEnhancementsOutputSchema = z.object({
  bioSuggestion: z
    .string()
    .describe('A suggested professional bio (2-3 sentences) based on the information found at the GitHub profile URL.'),
  skillSuggestions: z
    .array(z.string())
    .describe('A list of key technical skills inferred from the content visible at the GitHub profile URL.'),
});
export type SuggestProfileEnhancementsOutput = z.infer<typeof SuggestProfileEnhancementsOutputSchema>;

export async function suggestProfileEnhancements(input: SuggestProfileEnhancementsInput): Promise<SuggestProfileEnhancementsOutput> {
  return suggestProfileEnhancementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProfileEnhancementsPrompt',
  input: {schema: SuggestProfileEnhancementsInputSchema},
  output: {schema: SuggestProfileEnhancementsOutputSchema},
  prompt: `You are an AI assistant helping developers enhance their GitTalent profile.
Based on the provided GitHub profile URL, analyze the public repositories, contributions, and profile information found at that URL.

GitHub Profile URL: {{{githubProfileUrl}}}

Generate the following based on the content available at the URL:
1. A concise and engaging professional bio (around 2-3 sentences) suitable for a talent platform. Focus on accomplishments and key technologies if apparent from the profile content.
2. A list of key technical skills (programming languages, frameworks, significant libraries, tools) prominently visible or inferable from their profile content, pinned repositories, and recent activity found at the URL. Provide a diverse list if possible.

Format your output as a JSON object matching the defined schema.
`,
});

const suggestProfileEnhancementsFlow = ai.defineFlow(
  {
    name: 'suggestProfileEnhancementsFlow',
    inputSchema: SuggestProfileEnhancementsInputSchema,
    outputSchema: SuggestProfileEnhancementsOutputSchema,
  },
  async input => {
    console.log('[suggestProfileEnhancementsFlow] Input:', JSON.stringify(input));
    const {output} = await prompt(input);
    console.log('[suggestProfileEnhancementsFlow] Output from prompt:', JSON.stringify(output));
    return output!;
  }
);
