
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      const contentType = response.headers.get('Content-Type');
      console.log(`[fetchWebpageContentTool] Response Status: ${response.status} ${response.statusText} for URL: ${url}`);
      console.log(`[fetchWebpageContentTool] Content-Type: ${contentType} for URL: ${url}`);

      if (!response.ok) {
        let errorBody = "Could not retrieve error body.";
        try {
          errorBody = await response.text();
        } catch (bodyError: any) {
          console.warn(`[fetchWebpageContentTool] Could not read error body for ${url}:`, bodyError.message);
        }
        const errorText = `TOOL_ERROR: HTTP error fetching ${url}! Status: ${response.status} ${response.statusText}. Body snippet: ${errorBody.substring(0, 200)}`;
        console.error(`[fetchWebpageContentTool] ${errorText}`);
        return errorText;
      }
      
      const textContent = await response.text();
      console.log(`[fetchWebpageContentTool] Fetched content from ${url}. Total length: ${textContent.length}. First 500 chars: START_SNIPPET>>>${textContent.substring(0,500)}<<<END_SNIPPET`);
      
      const MIN_CONTENT_LENGTH = 2500; // Threshold for a minimally viable GitHub profile page
      if (textContent.length < MIN_CONTENT_LENGTH) {
        const toolErrorMessage = `TOOL_ERROR: Fetched content too short (length: ${textContent.length} characters, minimum expected: ${MIN_CONTENT_LENGTH}). This likely means the full profile page was not retrieved. The content started with: "${textContent.substring(0,150).replace(/\n/g, ' ')}..."`;
        console.warn(`[fetchWebpageContentTool] ${toolErrorMessage}`);
        return toolErrorMessage;
      }

      // Check for common login page phrases
      const lowerContent = textContent.toLowerCase();
      const loginPhrases = ["sign in to github", "username or email address", "password", "forgot password?", "create an account"];
      const errorPhrases = ["page not found", "this is not the web page you are looking for", "couldn't find that page", "404 error"];

      if (loginPhrases.some(phrase => lowerContent.includes(phrase))) {
        const detectedPhrase = loginPhrases.find(phrase => lowerContent.includes(phrase));
        const toolErrorMessage = `TOOL_ERROR: Detected login page content at ${url}. Found phrase: "${detectedPhrase}".`;
        console.warn(`[fetchWebpageContentTool] ${toolErrorMessage}`);
        return toolErrorMessage;
      }

      if (errorPhrases.some(phrase => lowerContent.includes(phrase))) {
        const detectedPhrase = errorPhrases.find(phrase => lowerContent.includes(phrase));
         const toolErrorMessage = `TOOL_ERROR: Detected error page content at ${url}. Found phrase: "${detectedPhrase}".`;
        console.warn(`[fetchWebpageContentTool] ${toolErrorMessage}`);
        return toolErrorMessage;
      }
      
      if (textContent.trim().toLowerCase().startsWith("expecting value: line 1 column 1")) {
        console.warn(`[fetchWebpageContentTool] The fetched textContent for ${url} appears to be a JSON parsing error itself: "${textContent}"`);
        return `TOOL_ERROR: The server at ${url} returned content that resulted in a parsing error: "${textContent}". This might indicate an issue with the remote server or an unexpected response format.`;
      }

      const MAX_CONTENT_LENGTH = 200000; 
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
        if (e.message.toLowerCase().includes("could not find a tag name to match")) {
          specificMessage = "Malformed HTML content received (e.g., 'could not find a tag name to match'). The page structure might be invalid or incomplete.";
        }
      } else if (typeof e === 'string') {
        specificMessage = e;
      } else {
        try {
          const stringifiedError = JSON.stringify(e);
          specificMessage = stringifiedError === '{}' ? 'Unknown error object.' : stringifiedError;
        } catch (stringifyError) {
          specificMessage = 'Could not stringify non-standard error object.';
        }
      }
      const toolErrorMessage = `TOOL_ERROR: Exception occurred while trying to process ${url}: ${specificMessage}. This could be due to network issues, an invalid URL, or an internal tool problem.`;
      console.error(`[fetchWebpageContentTool] Returning error: ${toolErrorMessage}`);
      return toolErrorMessage;
    }
  }
);
