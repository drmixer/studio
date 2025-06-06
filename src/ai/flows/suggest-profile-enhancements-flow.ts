
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
    .describe('A suggested professional bio, written in the first person (2-3 sentences). This bio should be based on analysis of the GitHub profile URL and any provided dashboard skills/projects. If fetching the GitHub profile fails (e.g., tool returns "TOOL_ERROR: Fetched content too short..." or "TOOL_ERROR: Detected login page..."), or the content is semantically unusable for analysis, the bio should state this and explain why (e.g., content too short, seems to be a login page, or lacks key profile elements possibly due to JavaScript-heavy rendering). If dashboard information is available, it might offer a bio based on that.'),
  skillSuggestions: z
    .array(z.string())
    .describe('A list of key technical skills inferred from the content visible at the GitHub profile URL and dashboard skills. This should be empty if no specific skills are found or if GitHub profile fetching fails/content is unusable and no dashboard skills are provided. Look for languages in repositories, skills mentioned in READMEs or the GitHub user bio. Do not include generic skills if nothing specific is found.'),
});
export type SuggestProfileEnhancementsOutput = z.infer<typeof SuggestProfileEnhancementsOutputSchema>;

export async function suggestProfileEnhancements(input: SuggestProfileEnhancementsInput): Promise<SuggestProfileEnhancementsOutput> {
  console.log('[suggestProfileEnhancementsFlow] Received input:', JSON.stringify(input, null, 2));
  let result = await suggestProfileEnhancementsPrimaryFlow(input);
  
  const gitHubFetchProblem = result?.bioSuggestion?.includes("Tool error: TOOL_ERROR:") || 
                             result?.bioSuggestion?.includes("tool error:") || 
                             (result?.bioSuggestion?.includes("content from the GitHub URL") && (result?.bioSuggestion?.includes("is very short") || result?.bioSuggestion?.includes("does not appear to be a valid") || result?.bioSuggestion?.includes("does not seem to be a semantically valid"))) ||
                             (result?.bioSuggestion?.includes("Failed to analyze the GitHub profile") && result?.bioSuggestion?.includes("does not seem to be a semantically valid"));


  if (gitHubFetchProblem && (input.dashboardSkills?.length || input.dashboardProjects?.length)) {
      console.log('[suggestProfileEnhancementsFlow] GitHub fetch problematic or content unusable. Attempting fallback bio generation using dashboard inputs.');
      
      let dashboardBioPromptText = `Based *only* on the following user-declared information, write a concise, engaging professional bio in the first person (e.g., "I am a...", "I specialize in...") (2-3 sentences). Make it sound natural. Do not mention that this bio is based on dashboard information unless no dashboard inputs are provided.`;
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
          input: { schema: z.object({}) }, 
          output: { schema: z.object({ bioSuggestion: z.string() })},
          prompt: dashboardBioPromptText,
      });

      try {
          const { output: fallbackOutput } = await fallbackPromptDef({});
          if (fallbackOutput?.bioSuggestion) {
              console.log('[suggestProfileEnhancementsFlow] Fallback bio generated:', fallbackOutput.bioSuggestion);
              
              let finalSkillSuggestions = result?.skillSuggestions || [];
              if (gitHubFetchProblem && input.dashboardSkills?.length) {
                  finalSkillSuggestions = input.dashboardSkills; 
              } else if (gitHubFetchProblem) {
                  finalSkillSuggestions = []; 
              }

              result = {
                  bioSuggestion: fallbackOutput.bioSuggestion,
                  skillSuggestions: finalSkillSuggestions, 
              };
          }
      } catch (fallbackError: any) {
          console.error('[suggestProfileEnhancementsFlow] Error during fallback bio generation:', fallbackError.message);
      }
  }

  console.log('[suggestProfileEnhancementsFlow] Sending final output:', JSON.stringify(result, null, 2));
  return result;
}

const primaryPrompt = ai.definePrompt({
  name: 'suggestProfileEnhancementsPrimaryPrompt',
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

2.  **Handle Tool Error (TOOL_ERROR)**:
    If the 'fetchWebpageContent' tool returns a string starting with "TOOL_ERROR:":
    -   'bioSuggestion': Return a message like: "Failed to process GitHub profile content. Tool error: [The exact error message returned by the tool, including 'TOOL_ERROR:' and any details that follow. For example, 'Tool error: TOOL_ERROR: Fetched content too short (length: 1234, minimum: 15000)...' or 'Tool error: TOOL_ERROR: Detected login page content...']. GitHub-based suggestions cannot be generated.{{#if dashboardSkills}} A suggestion based on dashboard inputs may be attempted separately.{{/if}}"
    -   'skillSuggestions': Return an empty array.
    Do not proceed with further analysis of GitHub content if the tool reported a TOOL_ERROR.

3.  **Analyze Fetched GitHub Content (If no TOOL_ERROR from step 2, meaning content was of sufficient length and did not trigger keyword-based tool errors):**
    Carefully examine the fetched HTML content.
    - First, determine if the content *semantically appears to be a valid, populated public GitHub profile page*. Look for key indicators like a list of repositories (e.g., elements with class names like 'repo-list' or itemprop="owns"), a user bio section (e.g., class 'user-profile-bio'), contribution activity sections (e.g., 'js-yearly-contributions'), or identifiable GitHub UI elements related to user content.
    - If the content, despite its length and passing initial tool checks, does NOT appear to be a valid or informative public profile (e.g., it's missing a clear repository list, a user bio, contribution data, seems to be a generic error/redirect page, or is otherwise too sparse for meaningful analysis even if long):
        -   'bioSuggestion': Return a message like: "Failed to analyze the GitHub profile from {{{githubProfileUrl}}}. Although the fetched content passed initial checks (e.g., for length and obvious errors), it does not seem to be a semantically valid or informative public GitHub profile page. This can happen if the page relies heavily on client-side JavaScript to display its primary content, which the current fetching method may not fully capture. For example, it might be missing key sections like repositories or bio. GitHub-based suggestions cannot be generated.{{#if dashboardSkills}} A suggestion based on dashboard inputs may be attempted separately.{{/if}} Snippet indicative of issue (first 100 chars): [the first 100 characters of the problematic content, cleaned of newlines for readability]"
        -   'skillSuggestions': Return an empty array.
        Do not proceed with GitHub-based suggestions if the content is deemed semantically unusable.

4.  **Generate Suggestions (If GitHub content was valid and informative as per step 3, or if GitHub analysis was skipped/failed and dashboard data is available):**

    *   **Bio Suggestion ('bioSuggestion'):**
        -   Craft a concise and engaging professional bio, **written in the first person** (e.g., "I am a...", "My experience includes...", "I am passionate about..."). Avoid phrases like "This individual is..." or "The user is...".
        -   The bio should be around 2-3 sentences long.
        -   If valid GitHub content was analyzed, prioritize insights from it (technical achievements, project highlights, key contributions).
        -   Seamlessly integrate 'dashboardSkills' to highlight areas of expertise.
        -   Incorporate noteworthy aspects from 'dashboardProjects' (titles and descriptions).
        -   Example (with good GitHub data): "I am a software engineer with experience in building scalable web applications using React and Node.js. My work on Project X, showcased on GitHub, demonstrates my ability to deliver impactful solutions. I'm also proficient in Python and enjoy exploring new cloud technologies."
        -   Example (if GitHub data was unusable/skipped, relying on dashboard): "I am a [role, e.g., software developer] specializing in [key dashboard skills]. My projects include [notable dashboard project titles], demonstrating my capabilities in [relevant areas]."
        -   If, after considering all available sources (GitHub, dashboard), there is truly insufficient information for a meaningful bio (e.g., GitHub content unusable AND no dashboard inputs), then 'bioSuggestion' should state: "Could not generate a bio suggestion due to limited information from your GitHub profile and dashboard inputs."

    *   **Skill Suggestions ('skillSuggestions'):**
        -   If valid GitHub content was analyzed, primarily identify skills from it. Look for specific programming languages, frameworks/libraries, tools, and platforms. Look for language statistics, repository topics, and text in user bio or READMEs.
        -   Complement and consolidate these with any 'dashboardSkills' provided. Aim for a unified list, avoiding redundancy.
        -   If GitHub content was unusable/skipped, 'skillSuggestions' should be based solely on 'dashboardSkills'.
        -   If no specific technical skills can be clearly identified from any source, 'skillSuggestions' should be an empty array. Do not list generic skills like "Problem Solving" if no specific technical evidence is found. Focus on concrete technical skills.

Format your output as a JSON object matching the defined schema.
`,
});

const suggestProfileEnhancementsPrimaryFlow = ai.defineFlow(
  {
    name: 'suggestProfileEnhancementsPrimaryFlow',
    inputSchema: SuggestProfileEnhancementsInputSchema,
    outputSchema: SuggestProfileEnhancementsOutputSchema,
  },
  async input => {
    console.log('[suggestProfileEnhancementsPrimaryFlow] Input to primary prompt:', JSON.stringify(input, null, 2));
    const {output: primaryOutput} = await primaryPrompt(input); 
    console.log('[suggestProfileEnhancementsPrimaryFlow] Output from primary prompt:', JSON.stringify(primaryOutput, null, 2));
    return primaryOutput!;
  }
);

    