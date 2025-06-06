
'use server';
/**
 * @fileOverview An AI flow to suggest profile enhancements (bio, skills) for a developer
 * based on their GitHub profile and GitTalent dashboard information.
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
  dashboardSkills: z
    .array(z.string())
    .optional()
    .describe('A list of technical skills the user has added to their GitTalent dashboard profile.'),
  dashboardProjects: z
    .array(z.object({ 
      title: z.string().describe("The title of the project."), 
      description: z.string().optional().describe("The description of the project.") 
    }))
    .optional()
    .describe('A list of projects (title and description) the user has added to their GitTalent dashboard.'),
});
export type SuggestProfileEnhancementsInput = z.infer<typeof SuggestProfileEnhancementsInputSchema>;

const SuggestProfileEnhancementsOutputSchema = z.object({
  bioSuggestion: z
    .string()
    .describe('A suggested professional bio (2-3 sentences) based on the information found at the GitHub profile URL and provided dashboard details. If fetching GitHub fails, this will contain the error. If content is fetched but insufficient for a bio, it will state that.'),
  skillSuggestions: z
    .array(z.string())
    .describe('A list of key technical skills inferred from the content visible at the GitHub profile URL and dashboard skills. This should be empty if no specific skills are found.'),
});
export type SuggestProfileEnhancementsOutput = z.infer<typeof SuggestProfileEnhancementsOutputSchema>;

export async function suggestProfileEnhancements(input: SuggestProfileEnhancementsInput): Promise<SuggestProfileEnhancementsOutput> {
  console.log('[suggestProfileEnhancementsFlow] Received input:', JSON.stringify(input, null, 2));
  const result = await suggestProfileEnhancementsFlow(input);
  console.log('[suggestProfileEnhancementsFlow] Sending output:', JSON.stringify(result, null, 2));
  return result;
}

const prompt = ai.definePrompt({
  name: 'suggestProfileEnhancementsPrompt',
  input: {schema: SuggestProfileEnhancementsInputSchema},
  output: {schema: SuggestProfileEnhancementsOutputSchema},
  tools: [fetchWebpageContentTool],
  prompt: `You are an AI assistant helping developers enhance their GitTalent profile.
Your task is to analyze a developer's GitHub profile content AND their self-declared information from the GitTalent dashboard to suggest improvements.

Information sources:
1. GitHub Profile Content (fetched using 'fetchWebpageContentTool' from 'githubProfileUrl'): This is the primary source for coding activity and publicly visible projects.
2. Dashboard Skills (if provided as 'dashboardSkills'): These are skills the user has explicitly listed on their GitTalent profile.
3. Dashboard Projects (if provided as 'dashboardProjects'): These are projects (title and description) the user has explicitly listed on their GitTalent profile.

GitHub Profile URL to fetch: {{{githubProfileUrl}}}

{{#if dashboardSkills.length}}
Dashboard Skills Provided:
{{#each dashboardSkills}}
- {{{this}}}
{{/each}}
{{else}}
Dashboard Skills Provided: None
{{/if}}

{{#if dashboardProjects.length}}
Dashboard Projects Provided:
{{#each dashboardProjects}}
- Project Title: {{{title}}}
  {{#if description}}Project Description: {{{description}}}{{/if}}
{{/each}}
{{else}}
Dashboard Projects Provided: None
{{/if}}

First, use the 'fetchWebpageContent' tool to get the HTML content of the developer's GitHub profile using the 'githubProfileUrl'.

If the 'fetchWebpageContent' tool returns a string starting with "TOOL_ERROR:":
- Your 'bioSuggestion' should state: "Failed to fetch GitHub profile content. Tool error: [The exact error message returned by the tool, including the 'TOOL_ERROR:' prefix and any details that follow]. Bio suggestion cannot be fully generated without GitHub profile analysis."
- Your 'skillSuggestions' should be an empty array if the GitHub profile could not be fetched. If 'dashboardSkills' were provided, you can suggest those, but state that they are from the dashboard only.
Do not attempt to analyze GitHub content further if fetching failed.

If GitHub content is successfully fetched (or if fetching failed but dashboard inputs are available for a partial response):
Analyze all available information (fetched GitHub content, dashboardSkills, dashboardProjects).
Based on a holistic view, generate:
1.  bioSuggestion: A concise and engaging professional bio (around 2-3 sentences).
    - Prioritize information from the fetched GitHub content for technical achievements and activity if available.
    - Use 'dashboardSkills' to highlight key areas of expertise the user wants to emphasize.
    - Incorporate noteworthy aspects from 'dashboardProjects' (titles and descriptions) if they add value.
    - If GitHub content is minimal or unavailable, lean more on dashboard inputs. Clearly state if the bio is primarily based on self-declared info (e.g., "Based on your dashboard profile...").
    - If all sources (GitHub, dashboard) provide insufficient information for a meaningful bio, your 'bioSuggestion' should state: "Could not generate a bio suggestion due to limited information from your GitHub profile and dashboard inputs."
2.  skillSuggestions: A list of key technical skills.
    - Primarily derive these from the fetched GitHub content (repository languages, project READMEs, user's GitHub bio text within the fetched content) if available.
    - Consider merging or complementing these with 'dashboardSkills'. Aim for a consolidated list, avoiding redundancy.
    - If no specific technical skills can be clearly identified from any source, your 'skillSuggestions' array should be empty.

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
    console.log('[suggestProfileEnhancementsFlow] Input to prompt:', JSON.stringify(input, null, 2));
    const {output} = await prompt(input);
    console.log('[suggestProfileEnhancementsFlow] Output from prompt:', JSON.stringify(output, null, 2));
    return output!;
  }
);
