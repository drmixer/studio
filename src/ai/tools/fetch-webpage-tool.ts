
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
      // CRITICAL LOG: What is textContent right after fetching?
      console.log(`[fetchWebpageContentTool] Raw textContent from response.text() for URL ${url}: START>>>${textContent}<<<END`);
      
      console.log(`[fetchWebpageContentTool] Successfully fetched content from ${url}. Initial length: ${textContent.length}`);
      
      const MAX_CONTENT_LENGTH = 200000; // Increased limit slightly
      if (textContent.length > MAX_CONTENT_LENGTH) {
        console.warn(`[fetchWebpageContentTool] Content from ${url} is very long (${textContent.length} chars). Truncating to ${MAX_CONTENT_LENGTH} chars.`);
        return textContent.substring(0, MAX_CONTENT_LENGTH);
      }
      // If textContent is the problematic JSON error string, it will be returned here
      if (textContent.trim().toLowerCase().startsWith("expecting value: line 1 column 1")) {
        console.warn(`[fetchWebpageContentTool] The fetched textContent for ${url} appears to be a JSON parsing error itself: "${textContent}"`);
        return `TOOL_ERROR: The server at ${url} returned content that resulted in a parsing error: "${textContent}". This might indicate an issue with the remote server or an unexpected response format.`;
      }
      return textContent;
    } catch (e: any) {
      console.error(`[fetchWebpageContentTool] Raw exception object during fetch for URL ${url}:`, e);
      let specificMessage = "An unexpected error occurred during the fetch operation itself.";
      if (e instanceof Error) {
        specificMessage = e.message; // This might be "Expecting value: line 1 column 1 (char 0)"
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
      const toolErrorMessage = `TOOL_ERROR: Exception occurred while trying to process ${url}: ${specificMessage}. The URL might be invalid, the network unavailable, or an issue within the fetch tool.`;
      console.error(`[fetchWebpageContentTool] Returning error: ${toolErrorMessage}`);
      return toolErrorMessage;
    }
  }
);

