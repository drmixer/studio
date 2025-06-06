
'use server';
/**
 * @fileOverview A Genkit tool to fetch GitHub profile and repository data using the GitHub API.
 *
 * - fetchGitHubProfileApiTool - The tool definition.
 * - GitHubProfileApiInputSchema - Input schema for the tool.
 * - GitHubProfileApiOutputSchema - Output schema for the tool.
 * - GitHubProfileApiInput - TypeScript type for the input.
 * - GitHubProfileApiOutput - TypeScript type for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GitHubProfileApiInputSchema = z.object({
  username: z.string().describe('The GitHub username.'),
});
export type GitHubProfileApiInput = z.infer<typeof GitHubProfileApiInputSchema>;

const RepositorySchema = z.object({
  name: z.string().describe('Name of the repository.'),
  description: z.string().nullable().describe('Description of the repository.'),
  language: z.string().nullable().describe('Primary programming language of the repository.'),
  stargazers_count: z.number().describe('Number of stars the repository has.'),
  html_url: z.string().url().describe('URL to the repository on GitHub.'),
  fork: z.boolean().describe('Whether the repository is a fork.'),
  updated_at: z.string().describe('Timestamp of the last update to the repository.'),
});

export const GitHubProfileApiOutputSchema = z.object({
  username: z.string().describe('The GitHub username.'),
  bio: z.string().nullable().describe('User\'s biography.'),
  name: z.string().nullable().describe('User\'s display name.'),
  location: z.string().nullable().describe('User\'s location.'),
  public_repos: z.number().describe('Number of public repositories.'),
  followers: z.number().describe('Number of followers.'),
  following: z.number().describe('Number of users the user is following.'),
  repositories: z.array(RepositorySchema).describe('A list of the user\'s public repositories.'),
  error: z.string().optional().describe('An error message if fetching failed.'),
});
export type GitHubProfileApiOutput = z.infer<typeof GitHubProfileApiOutputSchema>;

const GITHUB_API_BASE_URL = 'https://api.github.com';

export const fetchGitHubProfileApiTool = ai.defineTool(
  {
    name: 'fetchGitHubProfileApi',
    description: 'Fetches structured profile and repository data for a GitHub user via the GitHub API.',
    inputSchema: GitHubProfileApiInputSchema,
    outputSchema: GitHubProfileApiOutputSchema,
  },
  async ({username}) => {
    console.log(`[fetchGitHubProfileApiTool] Fetching data for username: ${username}`);
    try {
      // Fetch user profile data
      const userRes = await fetch(`${GITHUB_API_BASE_URL}/users/${username}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!userRes.ok) {
        const errorText = await userRes.text();
        console.error(`[fetchGitHubProfileApiTool] Error fetching user profile for ${username}: ${userRes.status} ${userRes.statusText} - ${errorText}`);
        return {
          username,
          bio: null,
          name: null,
          location: null,
          public_repos: 0,
          followers: 0,
          following: 0,
          repositories: [],
          error: `GitHub API error for user profile: ${userRes.status} ${userRes.statusText}. User might not exist or API limit reached. Details: ${errorText.substring(0,100)}`,
        };
      }
      const userData = await userRes.json();
      console.log(`[fetchGitHubProfileApiTool] Fetched user data for ${username}. Public repos: ${userData.public_repos}`);

      // Fetch user repositories
      // Sort by updated to get more recent/active ones, limit to top 50 non-forked for relevance
      const reposRes = await fetch(`${GITHUB_API_BASE_URL}/users/${username}/repos?type=owner&sort=updated&per_page=50`, {
         headers: { Accept: 'application/vnd.github.v3+json' },
      });

      let reposData: any[] = [];
      if (reposRes.ok) {
        reposData = await reposRes.json();
        console.log(`[fetchGitHubProfileApiTool] Fetched ${reposData.length} repositories for ${username}.`);
      } else {
        console.warn(`[fetchGitHubProfileApiTool] Could not fetch repositories for ${username}: ${reposRes.status} ${reposRes.statusText}`);
        // Continue with user data even if repos fail, but log it.
      }

      const repositories = reposData
        .filter(repo => !repo.fork) // Exclude forks for primary analysis
        .map(repo => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          html_url: repo.html_url,
          fork: repo.fork,
          updated_at: repo.updated_at,
        }));

      return {
        username: userData.login,
        bio: userData.bio,
        name: userData.name,
        location: userData.location,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        repositories,
      };
    } catch (e: any) {
      console.error(`[fetchGitHubProfileApiTool] Exception for ${username}:`, e.message);
      return {
        username,
        bio: null,
        name: null,
        location: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        repositories: [],
        error: `Tool exception: ${e.message}`,
      };
    }
  }
);
