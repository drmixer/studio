
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
    .describe('A suggested professional bio (2-3 sentences) based on the information found at the GitHub profile URL. If fetching fails, this will contain the error. If content is fetched but insufficient for a bio, it will state that.'),
  skillSuggestions: z
    .array(z.string())
    .describe('A list of key technical skills inferred from the content visible at the GitHub profile URL. This should be empty if no specific skills are found.'),
});
export type SuggestProfileEnhancementsOutput = z.infer<typeof SuggestProfileEnhancementsOutputSchema>;

export async function suggestProfileEnhancements(input: SuggestProfileEnhancementsInput): Promise<SuggestProfileEnhancementsOutput> {
  console.log('[suggestProfileEnhancementsFlow] Received input:', JSON.stringify(input));
  const result = await suggestProfileEnhancementsFlow(input);
  console.log('[suggestProfileEnhancementsFlow] Sending output:', JSON.stringify(result));
  return result;
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

If the 'fetchWebpageContent' tool returns a string starting with "TOOL_ERROR:":
- Your 'bioSuggestion' should state: "Failed to fetch profile content. Tool error: [The exact error message returned by the tool, including the 'TOOL_ERROR:' prefix and any details that follow]".
- Your 'skillSuggestions' should be an empty array.
Do not attempt to analyze further if fetching failed.

Otherwise, if HTML content is successfully fetched, analyze it thoroughly.
Based *only* on the information present in the successfully fetched HTML content, generate the following:
1. A concise and engaging professional bio (around 2-3 sentences) suitable for a talent platform. Focus on accomplishments and key technologies if apparent from the fetched content (e.g., from the user's bio text, descriptions of pinned repositories). If the fetched content is minimal or provides no clear information for a bio, your 'bioSuggestion' should state: "Could not generate a bio suggestion due to limited information in the fetched profile content."
2. A list of key technical skills (programming languages, frameworks, significant libraries, tools). Look for these in repository language statistics, project READMEs, titles, descriptions, and the user's profile text within the fetched content. If no specific technical skills can be clearly identified from the fetched content, your 'skillSuggestions' array should be empty. Do not list generic skills if they are not directly supported by the fetched content.

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
    console.log('[suggestProfileEnhancementsFlow] Input to prompt:', JSON.stringify(input));
    const {output} = await prompt(input);
    console.log('[suggestProfileEnhancementsFlow] Output from prompt:', JSON.stringify(output));
    return output!;
  }
);

