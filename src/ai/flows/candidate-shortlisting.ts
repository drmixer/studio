
'use server';

/**
 * @fileOverview AI-powered candidate shortlisting tool that analyzes GitHub profiles 
 * using data from the GitHub API to identify and shortlist promising candidates.
 *
 * - candidateShortlisting - A function that handles the candidate shortlisting process.
 * - CandidateShortlistingInput - The input type for the candidateShortlisting function.
 * - CandidateShortlistingOutput - The return type for the candidateShortlisting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchGitHubProfileApiTool, type GitHubProfileApiOutput } from '@/ai/tools/fetch-github-profile-api-tool';

const CandidateShortlistingInputSchema = z.object({
  githubProfileUrl: z
    .string()
    .describe('The URL of the candidate\'s GitHub profile (e.g., https://github.com/username).'),
});
export type CandidateShortlistingInput = z.infer<typeof CandidateShortlistingInputSchema>;

const CandidateShortlistingOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A summary of the candidate, including insights from their bio, key repositories (considering stars and recent activity), and overall GitHub presence. If fetching API data fails, this will contain an error explanation.'
    ),
  techStack: z
    .array(z.string())
    .describe('The tech stack of the candidate, inferred from their repository languages and descriptions. Empty if API data fetching fails or no distinct technologies are identified.'),
  flaggedItems: z
    .array(z.string())
    .describe('A list of 2-3 noteworthy items (positive or areas for attention) based on the API data (e.g., highly starred repo, lack of recent activity, unique skills). If API data fetching fails, one item will describe the issue.'),
  analyzedUsername: z.string().optional().describe('The GitHub username that was analyzed.'),
});
export type CandidateShortlistingOutput = z.infer<typeof CandidateShortlistingOutputSchema>;

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

export async function candidateShortlisting(input: CandidateShortlistingInput): Promise<CandidateShortlistingOutput> {
  console.log('[candidateShortlistingFlow] Received input:', JSON.stringify(input));
  
  const username = extractUsernameFromUrl(input.githubProfileUrl);
  if (!username) {
    const errorMsg = "Invalid GitHub Profile URL. Could not extract username.";
    console.error(`[candidateShortlistingFlow] ${errorMsg} from URL: ${input.githubProfileUrl}`);
    return {
      summary: errorMsg,
      techStack: [],
      flaggedItems: [errorMsg],
      analyzedUsername: input.githubProfileUrl, // Pass original URL if username extraction fails
    };
  }
  
  const result = await candidateShortlistingFlow({ username });
  console.log('[candidateShortlistingFlow] Sending output:', JSON.stringify(result));
  return {...result, analyzedUsername: username };
}

// Define an internal input schema for the flow that uses the username
const InternalFlowInputSchema = z.object({
  username: z.string(),
});

const prompt = ai.definePrompt({
  name: 'candidateShortlistingApiPrompt',
  input: { schema: z.object({ profileData: GitHubProfileApiOutputSchema }) }, // Prompt now expects structured data
  output: { schema: CandidateShortlistingOutputSchema },
  prompt: `You are an AI-powered recruiting assistant.
Your primary task is to analyze structured data from a candidate's GitHub profile (obtained via the GitHub API) to help a recruiter screen them.

GitHub Profile Data:
Username: {{{profileData.username}}}
Name: {{#if profileData.name}}{{{profileData.name}}}{{else}}Not provided{{/if}}
Bio: {{#if profileData.bio}}{{{profileData.bio}}}{{else}}Not provided{{/if}}
Location: {{#if profileData.location}}{{{profileData.location}}}{{else}}Not provided{{/if}}
Public Repositories Count: {{{profileData.public_repos}}}
Followers: {{{profileData.followers}}}
Following: {{{profileData.following}}}

Repositories (showing up to 50 non-forked, sorted by most recently updated):
{{#if profileData.repositories.length}}
{{#each profileData.repositories}}
- Name: {{{this.name}}} ({{#if this.language}}{{{this.language}}}{{else}}N/A{{/if}})
  Stars: {{{this.stargazers_count}}}
  Description: {{#if this.description}}{{{this.description}}}{{else}}No description.{{/if}}
  Last Updated: {{{this.updated_at}}}
  URL: {{{this.html_url}}}
{{/each}}
{{else}}
No public repositories found or provided.
{{/if}}

Based *only* on the provided GitHub API data:

- 'summary': Provide a concise summary of the candidate. Highlight their bio (if available), key skills suggested by repository languages and descriptions, and any standout projects (consider stars and recency of updates). Mention if the bio is missing or if there are few repositories.
- 'techStack': List the distinct programming languages and technologies explicitly mentioned in repository languages or inferred from repository names/descriptions. If no specific skills can be confidently identified, this should be an empty array.
- 'flaggedItems': List 2-3 particularly interesting or noteworthy items (positive or areas for attention). These should be based on the API data. For example: "Owns a highly starred repository: [Repo Name] (Stars: [Count])", "Actively maintains projects, last update on [Date]", "Limited public repository activity.", "Bio suggests expertise in [Area not obvious from repos]". If nothing specific stands out, this can be a single item like "Profile data appears standard." or "No specific items to flag based on the provided API data."

Format your output as a JSON object matching the defined schema.
Ensure 'analyzedUsername' in the final output will be set to {{{profileData.username}}}.
  `,
});

const candidateShortlistingFlow = ai.defineFlow(
  {
    name: 'candidateShortlistingFlow',
    inputSchema: InternalFlowInputSchema, // Flow takes username
    outputSchema: CandidateShortlistingOutputSchema,
    tools: [fetchGitHubProfileApiTool],
  },
  async ({username}) => {
    console.log('[candidateShortlistingFlow] Calling fetchGitHubProfileApiTool for username:', username);
    const profileData = await fetchGitHubProfileApiTool({ username });

    if (profileData.error) {
      console.error(`[candidateShortlistingFlow] Error from fetchGitHubProfileApiTool for ${username}: ${profileData.error}`);
      return {
        summary: `Failed to fetch GitHub profile data via API for ${username}. Error: ${profileData.error}`,
        techStack: [],
        flaggedItems: [`API Error: ${profileData.error}`],
        analyzedUsername: username,
      };
    }
    
    console.log('[candidateShortlistingFlow] Data from API tool for prompt:', JSON.stringify(profileData, null, 2));
    
    // Pass the structured data to the prompt
    const {output} = await prompt({ profileData }); 
    console.log('[candidateShortlistingFlow] Output from prompt:', JSON.stringify(output, null, 2));
    return {...output!, analyzedUsername: username };
  }
);
