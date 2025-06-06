
'use server';
/**
 * @fileOverview A Genkit tool to fetch the text content of a webpage.
 *
 * - fetchWebpageContentTool - The tool definition.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const FetchWebpageContentInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to fetch.'),
});
export type FetchWebpageContentInput = z.infer<typeof FetchWebpageContentInputSchema>;

export const FetchWebpageContentOutputSchema = z.string().describe('The text content of the fetched webpage, potentially including HTML tags. If an error occurs, it will be a string describing the error.');
export type FetchWebpageContentOutput = z.infer<typeof FetchWebpageContentOutputSchema>;


export const fetchWebpageContentTool = ai.defineTool(
  {
    name: 'fetchWebpageContent',
    description: 'Fetches the raw text content (may include HTML) of a given URL. Use this to get information from a webpage to analyze.',
    inputSchema: FetchWebpageContentInputSchema,
    outputSchema: FetchWebpageContentOutputSchema,
  },
  async ({url}) => {
    try {
      console.log(`[fetchWebpageContentTool] Attempting to fetch URL: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      if (!response.ok) {
        const errorText = `HTTP error fetching ${url}! Status: ${response.status} ${response.statusText}`;
        console.error(`[fetchWebpageContentTool] ${errorText}`);
        return `Error fetching content from ${url}: HTTP status ${response.status}. The page might be private, require login, or the server might be blocking automated requests.`;
      }
      const textContent = await response.text();
      console.log(`[fetchWebpageContentTool] Successfully fetched content from ${url}. Length: ${textContent.length}`);
      
      const MAX_CONTENT_LENGTH = 20000; // Increased slightly, LLMs can handle a fair bit of HTML.
      if (textContent.length > MAX_CONTENT_LENGTH) {
        console.warn(`[fetchWebpageContentTool] Content from ${url} is very long (${textContent.length} chars). Truncating to ${MAX_CONTENT_LENGTH} chars.`);
        return textContent.substring(0, MAX_CONTENT_LENGTH);
      }
      return textContent;
    } catch (e: any) {
      console.error(`[fetchWebpageContentTool] Exception fetching URL ${url}:`, e);
      return `Exception occurred while trying to fetch content from ${url}: ${e.message}. The URL might be invalid or the network unavailable.`;
    }
  }
);
