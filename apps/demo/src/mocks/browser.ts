import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

// Configure the MSW worker with the request handlers
export const worker = setupWorker(...handlers);
