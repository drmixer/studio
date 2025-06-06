
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
import { fetchWebpageContentTool } from '@/ai/tools/fetch-webpage-tool';

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
  tools: [fetchWebpageContentTool],
  prompt: `You are an AI assistant helping developers enhance their GitTalent profile.
Your task is to analyze a developer's GitHub profile content and suggest improvements.
First, use the 'fetchWebpageContent' tool to get the HTML content of the developer's GitHub profile using the 'githubProfileUrl' provided in the input.

GitHub Profile URL to fetch: {{{githubProfileUrl}}}

If the fetching tool returns an error message, your bioSuggestion should state that the profile could not be accessed and why, and skillSuggestions should be an empty array.
Otherwise, once you have the fetched HTML content, analyze it thoroughly.
Based *only* on the information present in the fetched HTML content, generate the following:
1. A concise and engaging professional bio (around 2-3 sentences) suitable for a talent platform. Focus on accomplishments and key technologies if apparent from the fetched content.
2. A list of key technical skills (programming languages, frameworks, significant libraries, tools) prominently visible or inferable from their profile text, pinned repositories, and project descriptions within the fetched content.

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
