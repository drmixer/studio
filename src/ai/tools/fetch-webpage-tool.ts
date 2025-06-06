
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

export const FetchWebpageContentOutputSchema = z.string().describe('The text content of the fetched webpage, potentially including HTML tags. If an error occurs, it will be a string describing the error, prefixed with "TOOL_ERROR:".');
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
          // Using a more common browser User-Agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      const contentType = response.headers.get('Content-Type');
      console.log(`[fetchWebpageContentTool] Response Status: ${response.status} for URL: ${url}`);
      console.log(`[fetchWebpageContentTool] Content-Type: ${contentType} for URL: ${url}`);

      if (!response.ok) {
        let errorBody = "Could not retrieve error body.";
        try {
          errorBody = await response.text();
        } catch (bodyError) {
          console.warn(`[fetchWebpageContentTool] Could not read error body for ${url}:`, bodyError);
        }
        const errorText = `HTTP error fetching ${url}! Status: ${response.status} ${response.statusText}. Body snippet: ${errorBody.substring(0, 200)}`;
        console.error(`[fetchWebpageContentTool] ${errorText}`);
        return `TOOL_ERROR: Failed to fetch content from ${url}. HTTP Status: ${response.status} ${response.statusText}.`;
      }
      
      const textContent = await response.text();
      console.log(`[fetchWebpageContentTool] Successfully fetched content from ${url}. Initial length: ${textContent.length}`);
      
      const MAX_CONTENT_LENGTH = 20000; 
      if (textContent.length > MAX_CONTENT_LENGTH) {
        console.warn(`[fetchWebpageContentTool] Content from ${url} is very long (${textContent.length} chars). Truncating to ${MAX_CONTENT_LENGTH} chars.`);
        return textContent.substring(0, MAX_CONTENT_LENGTH);
      }
      return textContent;
    } catch (e: any) {
      console.error(`[fetchWebpageContentTool] Raw exception object during fetch for URL ${url}:`, e);
      let specificMessage = "An unexpected error occurred during the fetch operation itself.";
      if (e instanceof Error) {
        specificMessage = e.message;
      } else if (typeof e === 'string') {
        specificMessage = e;
      } else {
        try {
          // Attempt to stringify if it's an object, but don't let this fail
          const stringifiedError = JSON.stringify(e);
          specificMessage = stringifiedError === '{}' ? 'Unknown error object.' : stringifiedError;
        } catch (stringifyError) {
          specificMessage = 'Could not stringify non-standard error object.';
        }
      }
      console.error(`[fetchWebpageContentTool] Exception processing URL ${url}. Specific message: ${specificMessage}`);
      return `TOOL_ERROR: Exception occurred while trying to process ${url}: ${specificMessage}. The URL might be invalid, the network unavailable, or an issue within the fetch tool.`;
    }
  }
);


    