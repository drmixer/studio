
import { config } from 'dotenv';
config();

import '@/ai/flows/candidate-shortlisting.ts';
import '@/ai/flows/suggest-profile-enhancements-flow.ts';
import '@/ai/tools/fetch-webpage-tool.ts'; // Keep for other potential uses
import '@/ai/tools/fetch-github-profile-api-tool.ts';
    