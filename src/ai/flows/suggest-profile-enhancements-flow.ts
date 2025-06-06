
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
    .describe('A suggested professional bio, written in the first person (2-3 sentences). This bio should be based on analysis of the GitHub profile URL and any provided dashboard skills/projects. If fetching the GitHub profile fails, the bio should be generated using dashboard information if available, or state that not enough information was found. If the tool itself returns an error (e.g., "TOOL_ERROR:"), that error should be reflected here.'),
  skillSuggestions: z
    .array(z.string())
    .describe('A list of key technical skills inferred from the content visible at the GitHub profile URL and dashboard skills. This should be empty if no specific skills are found or if GitHub profile fetching fails and no dashboard skills are provided.'),
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
  prompt: `You are an AI assistant helping developers craft a compelling professional profile for GitTalent.
Your task is to generate a bio suggestion and a list of skill suggestions.

Information sources to consider:
1.  GitHub Profile Content: Fetched using the 'fetchWebpageContentTool' from 'githubProfileUrl'. This is a primary source for coding activity and public projects.
2.  Dashboard Skills: (if 'dashboardSkills' is provided) Skills explicitly listed by the user on their GitTalent profile.
3.  Dashboard Projects: (if 'dashboardProjects' is provided) Projects (title and description) explicitly listed by the user.

GitHub Profile URL to fetch: {{{githubProfileUrl}}}

{{#if dashboardSkills.length}}
User's Self-Declared Dashboard Skills:
{{#each dashboardSkills}}
- {{{this}}}
{{/each}}
{{else}}
User's Self-Declared Dashboard Skills: None provided.
{{/if}}

{{#if dashboardProjects.length}}
User's Self-Declared Dashboard Projects:
{{#each dashboardProjects}}
- Project Title: {{{title}}}
  {{#if description}}Project Description: {{{description}}}{{/if}}
{{/each}}
{{else}}
User's Self-Declared Dashboard Projects: None provided.
{{/if}}

Instructions:

1.  **Fetch GitHub Content**: First, use the 'fetchWebpageContent' tool to get the HTML content of the developer's GitHub profile from 'githubProfileUrl'.

2.  **Handle Fetch Failure**:
    If the 'fetchWebpageContent' tool returns a string starting with "TOOL_ERROR:":
    -   'bioSuggestion': Return a message like: "Failed to fetch GitHub profile content. Tool error: [The exact error message returned by the tool, including the 'TOOL_ERROR:' prefix and any details that follow]. A bio suggestion cannot be fully generated without GitHub profile analysis."
    -   'skillSuggestions': Return an empty array.
    Do not proceed with further analysis if fetching failed with a TOOL_ERROR.

3.  **Generate Suggestions (if GitHub content is available OR if dashboard inputs are provided):**

    *   **Bio Suggestion ('bioSuggestion'):**
        -   Craft a concise and engaging professional bio, **written in the first person** (e.g., "I am a...", "My experience includes...", "I am passionate about...").
        -   The bio should be around 2-3 sentences long.
        -   **Synthesize information**:
            -   If GitHub content was successfully fetched and is informative, prioritize insights from it (technical achievements, project highlights, key contributions).
            -   Integrate 'dashboardSkills' to highlight areas of expertise the user wants to emphasize.
            -   Incorporate noteworthy aspects from 'dashboardProjects' (titles and descriptions).
            -   **If GitHub content is minimal or unavailable (but no TOOL_ERROR occurred), craft the best possible first-person bio using the 'dashboardSkills' and 'dashboardProjects'.** Make it sound natural and professional.
        -   If, after considering all available sources (GitHub, dashboard), there is truly insufficient information for a meaningful bio (e.g., no GitHub content AND no dashboard inputs), then 'bioSuggestion' should state: "Could not generate a bio suggestion due to limited information from your GitHub profile and dashboard inputs."

    *   **Skill Suggestions ('skillSuggestions'):**
        -   Derive a list of key technical skills.
        -   If GitHub content was successfully fetched, primarily identify skills from it (repository languages, project READMEs, user's GitHub bio text within the fetched content).
        -   Complement and consolidate these with any 'dashboardSkills' provided. Aim for a unified list, avoiding redundancy.
        -   If no specific technical skills can be clearly identified from any source, 'skillSuggestions' should be an empty array.

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
    if (output && output.bioSuggestion && output.bioSuggestion.startsWith("Failed to fetch GitHub profile content. Tool error: TOOL_ERROR: Expecting value: line 1 column 1 (char 0)")) {
        // Attempt to generate bio from dashboard inputs if GitHub fetch failed with the specific JSON parsing error
        const dashboardBioPrompt = `Based *only* on the following user-declared information, write a concise, engaging professional bio in the first person (2-3 sentences).
        User's Self-Declared Dashboard Skills: ${input.dashboardSkills?.join(', ') || 'None provided.'}
        User's Self-Declared Dashboard Projects: ${input.dashboardProjects?.map(p => `${p.title}${p.description ? ': ' + p.description : ''}`).join('; ') || 'None provided.'}
        If no dashboard information is available, state: "Could not generate a bio suggestion due to limited information."`;
        
        const fallbackPrompt = ai.definePrompt({
            name: 'fallbackBioPrompt',
            input: { schema: z.object({}) }, // No specific input schema needed, already have data
            output: { schema: z.object({ bioSuggestion: z.string() })},
            prompt: dashboardBioPrompt,
        });
        try {
            console.log('[suggestProfileEnhancementsFlow] Attempting fallback bio generation due to GitHub fetch error.');
            const fallbackResponse = await fallbackPrompt({});
            if (fallbackResponse.output?.bioSuggestion) {
                console.log('[suggestProfileEnhancementsFlow] Fallback bio generated:', fallbackResponse.output.bioSuggestion);
                return {
                    ...output, // Keep original skillSuggestions (likely empty) and the error message in bio if desired, or overwrite bio
                    bioSuggestion: fallbackResponse.output.bioSuggestion, // Overwrite with fallback
                };
            }
        } catch (fallbackError: any) {
            console.error('[suggestProfileEnhancementsFlow] Error during fallback bio generation:', fallbackError.message);
            // Stick with the original error message in bioSuggestion
        }
    }
    return output!;
  }
);

