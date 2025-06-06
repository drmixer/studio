
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
    .describe('A suggested professional bio, written in the first person (2-3 sentences). This bio should be based on analysis of the GitHub profile URL and any provided dashboard skills/projects. If fetching the GitHub profile fails, or the content is unusable, the bio should state this. If dashboard information is available, it might offer a bio based on that. If the tool itself returns an error (e.g., "TOOL_ERROR:"), that error should be reflected here.'),
  skillSuggestions: z
    .array(z.string())
    .describe('A list of key technical skills inferred from the content visible at the GitHub profile URL and dashboard skills. This should be empty if no specific skills are found or if GitHub profile fetching fails/content is unusable and no dashboard skills are provided. Look for languages in repositories, skills mentioned in READMEs or the GitHub user bio. Do not include generic skills if nothing specific is found.'),
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

2.  **Handle Fetch Failure (TOOL_ERROR)**:
    If the 'fetchWebpageContent' tool returns a string starting with "TOOL_ERROR:":
    -   'bioSuggestion': Return a message like: "Failed to fetch GitHub profile content. Tool error: [The exact error message returned by the tool, including the 'TOOL_ERROR:' prefix and any details that follow]. A bio suggestion cannot be fully generated without GitHub profile analysis.{{#if dashboardSkills}} However, a suggestion can be attempted based on your dashboard inputs.{{/if}}"
    -   'skillSuggestions': Return an empty array.
    Do not proceed with further analysis of GitHub content if fetching failed with a TOOL_ERROR.

3.  **Handle Unusable GitHub Content (Not a TOOL_ERROR)**:
    If the fetched GitHub content is NOT a TOOL_ERROR, but it appears to be a login page (e.g., contains "Sign in to GitHub", "Username or email address", "Password"), an error page (e.g., "Page not found"), or is unusually short (e.g. less than 500 characters) and lacks typical public profile information:
    -   'bioSuggestion': Return a message like: "The content fetched from your GitHub URL ({{{githubProfileUrl}}}) does not appear to be a valid public profile. It might be a login page, an error page, or a very sparse profile. GitHub-based suggestions cannot be generated.{{#if dashboardSkills}} However, a suggestion can be attempted based on your dashboard inputs.{{/if}}"
    -   'skillSuggestions': Return an empty array (skills cannot be derived from this GitHub content).
    Do not proceed with further analysis of GitHub content if it's of this nature.

4.  **Generate Suggestions (If GitHub content is usable OR if dashboard inputs are available for fallback):**

    *   **Bio Suggestion ('bioSuggestion'):**
        -   Craft a concise and engaging professional bio, **written in the first person** (e.g., "I am a...", "My experience includes...", "I am passionate about..."). Avoid phrases like "This individual is..." or "The user is...".
        -   The bio should be around 2-3 sentences long.
        -   **If GitHub content was successfully fetched, is informative, and not flagged as unusable in step 3**:
            -   Prioritize insights from the GitHub content (technical achievements, project highlights, key contributions).
            -   Integrate 'dashboardSkills' to highlight areas of expertise the user wants to emphasize.
            -   Incorporate noteworthy aspects from 'dashboardProjects' (titles and descriptions).
        -   **If GitHub content was NOT usable (due to TOOL_ERROR or unusable content as per step 2 or 3), OR if usable GitHub content is very minimal**:
            -   Craft the best possible first-person bio using ONLY the 'dashboardSkills' and 'dashboardProjects'. Make it sound natural and professional. Do not explicitly state that the bio is based only on dashboard information unless no dashboard information is provided.
        -   If, after considering all available sources (GitHub, dashboard), there is truly insufficient information for a meaningful bio (e.g., GitHub fetch failed/unusable AND no dashboard inputs), then 'bioSuggestion' should state: "Could not generate a bio suggestion due to limited information from your GitHub profile and dashboard inputs."

    *   **Skill Suggestions ('skillSuggestions'):**
        -   **If GitHub content was successfully fetched, is informative, and not flagged as unusable in step 3**:
            -   Primarily identify skills from the GitHub content (repository languages, project READMEs, user's GitHub bio text). Look for specific programming languages, frameworks, libraries, and tools.
            -   Complement and consolidate these with any 'dashboardSkills' provided. Aim for a unified list, avoiding redundancy.
        -   **Otherwise (GitHub content unusable or failed to fetch)**:
             -  If 'dashboardSkills' are provided, return those as 'skillSuggestions'.
             -  If no 'dashboardSkills' are provided, 'skillSuggestions' should be an empty array.
        -   If no specific technical skills can be clearly identified from any source, 'skillSuggestions' should be an empty array. Do not list generic skills if no specific evidence is found.

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
    console.log('[suggestProfileEnhancementsFlow] Input to primary prompt:', JSON.stringify(input, null, 2));
    const {output: primaryOutput} = await prompt(input); 
    console.log('[suggestProfileEnhancementsFlow] Output from primary prompt:', JSON.stringify(primaryOutput, null, 2));

    // Check if the primary attempt indicated GitHub fetch failure or unusable content, AND dashboard inputs are available
    const gitHubFetchProblem = primaryOutput?.bioSuggestion?.includes("Tool error: TOOL_ERROR:") || 
                               primaryOutput?.bioSuggestion?.includes("does not appear to be a valid public profile");

    if (gitHubFetchProblem && (input.dashboardSkills?.length || input.dashboardProjects?.length)) {
        console.log('[suggestProfileEnhancementsFlow] GitHub fetch problematic. Attempting fallback bio generation using dashboard inputs.');
        
        // Construct a focused prompt for dashboard-only bio
        let dashboardBioPromptText = `Based *only* on the following user-declared information, write a concise, engaging professional bio in the first person (e.g., "I am a...", "I specialize in...") (2-3 sentences). Make it sound natural.`;
        if (input.dashboardSkills?.length) {
            dashboardBioPromptText += `\nUser's Self-Declared Dashboard Skills: ${input.dashboardSkills.join(', ')}.`;
        } else {
            dashboardBioPromptText += `\nUser's Self-Declared Dashboard Skills: None provided.`;
        }
        if (input.dashboardProjects?.length) {
            dashboardBioPromptText += `\nUser's Self-Declared Dashboard Projects:\n${input.dashboardProjects.map(p => `- ${p.title}${p.description ? ': ' + p.description : ''}`).join('\n')}.`;
        } else {
            dashboardBioPromptText += `\nUser's Self-Declared Dashboard Projects: None provided.`;
        }
        if (!input.dashboardSkills?.length && !input.dashboardProjects?.length) {
             dashboardBioPromptText += `\nIf no dashboard information is provided, the bio should state: "Could not generate a bio suggestion due to limited dashboard information and issues with GitHub profile access."`;
        }
        
        const fallbackPromptDef = ai.definePrompt({
            name: 'dashboardOnlyBioPrompt', 
            input: { schema: z.object({}) }, // No input needed beyond the prompt itself
            output: { schema: z.object({ bioSuggestion: z.string() })},
            prompt: dashboardBioPromptText,
        });

        try {
            const { output: fallbackOutput } = await fallbackPromptDef({});
            if (fallbackOutput?.bioSuggestion) {
                console.log('[suggestProfileEnhancementsFlow] Fallback bio generated:', fallbackOutput.bioSuggestion);
                // Preserve skill suggestions from the primary attempt if they were based on dashboard skills, 
                // or ensure it's empty if it was meant to be due to GitHub issues.
                let finalSkillSuggestions = primaryOutput?.skillSuggestions || [];
                if (gitHubFetchProblem && input.dashboardSkills?.length) {
                    finalSkillSuggestions = input.dashboardSkills;
                } else if (gitHubFetchProblem) {
                    finalSkillSuggestions = [];
                }

                return {
                    bioSuggestion: fallbackOutput.bioSuggestion,
                    skillSuggestions: finalSkillSuggestions, 
                };
            }
        } catch (fallbackError: any) {
            console.error('[suggestProfileEnhancementsFlow] Error during fallback bio generation:', fallbackError.message);
            // If fallback also fails, return the original message (which already indicates the GitHub problem)
            return primaryOutput!; 
        }
    }
    // If no GitHub fetch problem, or if there was a problem but no dashboard data for fallback, return primary output.
    return primaryOutput!;
  }
);

