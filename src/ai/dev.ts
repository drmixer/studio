
import { config } from 'dotenv';
config();

import '@/ai/flows/candidate-shortlisting.ts';
import '@/ai/flows/suggest-profile-enhancements-flow.ts';
import '@/ai/tools/fetch-webpage-tool.ts';
