
'use server';
/**
 * @fileOverview An AI flow to suggest profile enhancements (bio, skills) for a developer
 * based on their GitHub profile data (via API) and GitTalent dashboard information.
 *
 * - suggestProfileEnhancements - A function that calls the AI flow.
 * - SuggestProfileEnhancementsInput - The input type.
 * - SuggestProfileEnhancementsOutput - The output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchGitHubProfileApiTool, GitHubProfileApiOutputSchema, type GitHubProfileApiOutput } from '@/ai/tools/fetch-github-profile-api-tool';

const SuggestProfileEnhancementsInputSchema = z.object({
  githubProfileUrl: z
    .string()
    .describe('The URL of the developer\'s GitHub profile (e.g., https://github.com/username).'),
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
    .describe('A suggested professional bio, written in the first person (2-3 sentences). This bio should be based on analysis of the GitHub API data and any provided dashboard skills/projects. If fetching GitHub API data fails, the bio should state this and explain why. If dashboard information is available, it might offer a bio based on that.'),
  skillSuggestions: z
    .array(z.string())
    .describe('A list of key technical skills inferred from GitHub API data (repository languages, user bio) and dashboard skills. This should be empty if no specific skills are found or if GitHub API data fetching fails and no dashboard skills are provided.'),
  analyzedUsername: z.string().optional().describe('The GitHub username that was analyzed.'),
});
export type SuggestProfileEnhancementsOutput = z.infer<typeof SuggestProfileEnhancementsOutputSchema>;

function extractUsernameFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === 'github.com') {
      const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        return pathParts[0];
      }
    }
  } catch (e) {
    console.warn('[extractUsernameFromUrl] Invalid URL:', url, e);
  }
  return null;
}

export async function suggestProfileEnhancements(input: SuggestProfileEnhancementsInput): Promise<SuggestProfileEnhancementsOutput> {
  console.log('[suggestProfileEnhancementsFlow] Received input:', JSON.stringify(input, null, 2));

  const username = extractUsernameFromUrl(input.githubProfileUrl);
  if (!username) {
    const errorMsg = "Invalid GitHub Profile URL. Could not extract username.";
    console.error(`[suggestProfileEnhancementsFlow] ${errorMsg} from URL: ${input.githubProfileUrl}`);
    // Attempt fallback with dashboard data if username extraction fails
    const fallbackResult = await generateFallbackSuggestions(input.dashboardSkills, input.dashboardProjects);
    return {
      bioSuggestion: fallbackResult.bioSuggestion || errorMsg,
      skillSuggestions: fallbackResult.skillSuggestions || [],
      analyzedUsername: input.githubProfileUrl, // Pass original URL
    };
  }

  const result = await suggestProfileEnhancementsPrimaryFlow({
    username,
    dashboardSkills: input.dashboardSkills,
    dashboardProjects: input.dashboardProjects
  });

  // Check if API fetch failed and dashboard data exists for a fallback.
  const apiFetchProblem = result?.bioSuggestion?.includes("Failed to fetch GitHub profile data via API") ||
                          result?.bioSuggestion?.includes("GitHub API error") ||
                          result?.bioSuggestion?.includes("Tool exception");

  if (apiFetchProblem && (input.dashboardSkills?.length || input.dashboardProjects?.length)) {
      console.log('[suggestProfileEnhancementsFlow] GitHub API fetch problematic. Attempting fallback bio generation using dashboard inputs.');
      const fallbackResult = await generateFallbackSuggestions(input.dashboardSkills, input.dashboardProjects, result.bioSuggestion);

      // Use API skills if available and not an API error, otherwise fallback to dashboard skills
      let finalSkillSuggestions = result.skillSuggestions || [];
      if (apiFetchProblem && input.dashboardSkills?.length) {
          finalSkillSuggestions = input.dashboardSkills;
      } else if (apiFetchProblem) {
          finalSkillSuggestions = [];
      }

      return {
        bioSuggestion: fallbackResult.bioSuggestion,
        skillSuggestions: finalSkillSuggestions,
        analyzedUsername: username,
      };
  }

  console.log('[suggestProfileEnhancementsFlow] Sending final output:', JSON.stringify(result, null, 2));
  return {...result, analyzedUsername: username };
}

async function generateFallbackSuggestions(
  dashboardSkills?: string[],
  dashboardProjects?: Array<{title: string, description?: string}>,
  originalApiError?: string
): Promise<{bioSuggestion: string, skillSuggestions: string[]}> {
    let dashboardBioPromptText = `Based *only* on the following user-declared information, write a concise, engaging professional bio in the first person (e.g., "I am a...", "I specialize in...") (2-3 sentences). Make it sound natural.`;
    if (originalApiError) {
        dashboardBioPromptText = `The GitHub profile analysis failed with the error: "${originalApiError}".\nNow, ${dashboardBioPromptText}`;
    }

    if (dashboardSkills?.length) {
        dashboardBioPromptText += `\nUser's Self-Declared Dashboard Skills: ${dashboardSkills.join(', ')}.`;
    } else {
        dashboardBioPromptText += `\nUser's Self-Declared Dashboard Skills: None provided.`;
    }
    if (dashboardProjects?.length) {
        dashboardBioPromptText += `\nUser's Self-Declared Dashboard Projects:\n${dashboardProjects.map(p => `- ${p.title}${p.description ? ': ' + p.description : ''}`).join('\n')}.`;
    } else {
        dashboardBioPromptText += `\nUser's Self-Declared Dashboard Projects: None provided.`;
    }
    if (!dashboardSkills?.length && !dashboardProjects?.length) {
         dashboardBioPromptText += `\nIf no dashboard information is provided, the bio should state: "Could not generate a bio suggestion due to limited dashboard information and issues with GitHub profile access."`;
    }

    const fallbackPromptDef = ai.definePrompt({
        name: 'dashboardOnlyBioPromptForEnhancements',
        input: { schema: z.object({}) },
        output: { schema: z.object({ bioSuggestion: z.string() })},
        prompt: dashboardBioPromptText,
    });

    try {
        const { output: fallbackOutput } = await fallbackPromptDef({});
        if (fallbackOutput?.bioSuggestion) {
            console.log('[suggestProfileEnhancementsFlow] Fallback bio generated:', fallbackOutput.bioSuggestion);
            return {
                bioSuggestion: fallbackOutput.bioSuggestion,
                skillSuggestions: dashboardSkills || [],
            };
        }
    } catch (fallbackError: any) {
        console.error('[suggestProfileEnhancementsFlow] Error during fallback bio generation:', fallbackError.message);
    }
    return {
        bioSuggestion: "Could not generate fallback bio.",
        skillSuggestions: dashboardSkills || []
    };
}


// Internal flow input schema expecting username
const InternalFlowInputSchema = z.object({
  username: z.string(),
  dashboardSkills: z.array(z.string()).optional(),
  dashboardProjects: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
});


const primaryPrompt = ai.definePrompt({
  name: 'suggestProfileEnhancementsApiPrompt',
  input: { schema: z.object({
      profileData: GitHubProfileApiOutputSchema,
      dashboardSkills: z.array(z.string()).optional(),
      dashboardProjects: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
  }) },
  output: { schema: SuggestProfileEnhancementsOutputSchema },
  prompt: `You are an AI assistant helping developers craft a compelling professional profile for GitTalent.
Your task is to generate a bio suggestion and a list of skill suggestions.

Information sources to consider:
1.  GitHub Profile Data (from API): User's bio, repository names, languages, descriptions.
2.  Dashboard Skills: (if 'dashboardSkills' is provided) Skills explicitly listed by the user.
3.  Dashboard Projects: (if 'dashboardProjects' is provided) Projects explicitly listed by the user.

GitHub Profile Data (for {{{profileData.username}}}):
Name: {{#if profileData.name}}{{{profileData.name}}}{{else}}Not provided{{/if}}
Bio from GitHub: {{#if profileData.bio}}{{{profileData.bio}}}{{else}}Not provided{{/if}}
Location: {{#if profileData.location}}{{{profileData.location}}}{{else}}Not provided{{/if}}
Number of Public Repos: {{{profileData.public_repos}}}
Repositories (Top 50 non-forked, by last update):
{{#if profileData.repositories.length}}
{{#each profileData.repositories}}
- {{{this.name}}} (Language: {{#if this.language}}{{{this.language}}}{{else}}N/A{{/if}}, Stars: {{{this.stargazers_count}}}) {{#if this.description}}: {{{this.description}}}{{/if}}
{{/each}}
{{else}}
No public repositories data provided.
{{/if}}

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

1.  **Bio Suggestion ('bioSuggestion'):**
    -   Craft a concise and engaging professional bio, **written in the first person** (e.g., "I am a...", "My experience includes...", "I am passionate about...").
    -   The bio should be around 2-3 sentences long.
    -   Prioritize insights from the GitHub API data (GitHub bio, languages from key repos, project themes).
    -   Seamlessly integrate 'dashboardSkills' to highlight areas of expertise.
    -   Incorporate noteworthy aspects from 'dashboardProjects'.
    -   If the GitHub bio is insightful, try to build upon it or refine it.
    -   Example: "I am a software engineer with experience in building scalable web applications using React and Node.js (evident from my GitHub projects like 'ProjectX' and 'ProjectY'). My work, including [key dashboard project if different], demonstrates my ability to deliver impactful solutions. I'm also proficient in Python and enjoy exploring new cloud technologies, as listed in my skills."
    -   If GitHub data is minimal (e.g., no bio, few repos) but dashboard data exists, lean more on dashboard inputs.
    -   If there is insufficient information from all sources for a meaningful bio, state: "Could not generate a bio suggestion due to limited information from your GitHub profile API data and dashboard inputs."

2.  **Skill Suggestions ('skillSuggestions'):**
    -   Primarily identify skills from GitHub API data: repository languages, terms in GitHub bio, common themes in repository descriptions/names.
    -   Complement and consolidate these with any 'dashboardSkills' provided. Aim for a unified list, avoiding redundancy but ensuring user's declared skills are respected.
    -   If GitHub API data yields no specific skills, 'skillSuggestions' should be based solely on 'dashboardSkills'.
    -   If no specific technical skills can be clearly identified from any source, 'skillSuggestions' should be an empty array. Focus on concrete technical skills.

Format your output as a JSON object matching the defined schema.
Ensure 'analyzedUsername' in the final output will be set to {{{profileData.username}}}.
`,
});

const suggestProfileEnhancementsPrimaryFlow = ai.defineFlow(
  {
    name: 'suggestProfileEnhancementsPrimaryFlow',
    inputSchema: InternalFlowInputSchema, // Expects username and dashboard data
    outputSchema: SuggestProfileEnhancementsOutputSchema,
    tools: [fetchGitHubProfileApiTool],
  },
  async ({username, dashboardSkills, dashboardProjects}) => {
    console.log(`[suggestProfileEnhancementsPrimaryFlow] Calling fetchGitHubProfileApiTool for username: ${username}`);
    const profileData = await fetchGitHubProfileApiTool({ username });

    if (profileData.error) {
      console.error(`[suggestProfileEnhancementsPrimaryFlow] Error from fetchGitHubProfileApiTool for ${username}: ${profileData.error}`);
      return {
        bioSuggestion: `Failed to fetch GitHub profile data via API for ${username}. Error: ${profileData.error}`,
        skillSuggestions: dashboardSkills || [], // Fallback to dashboard skills if API fails
        analyzedUsername: username,
      };
    }

    console.log('[suggestProfileEnhancementsPrimaryFlow] Data from API tool for prompt:', JSON.stringify(profileData, null, 2));

    const {output: primaryOutput} = await primaryPrompt({
        profileData,
        dashboardSkills,
        dashboardProjects
    });
    console.log('[suggestProfileEnhancementsPrimaryFlow] Output from primary prompt:', JSON.stringify(primaryOutput, null, 2));
    return {...primaryOutput!, analyzedUsername: username };
  }
);
