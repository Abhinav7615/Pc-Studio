import { scheduleCleanupJobs } from './mediaCleanup';

try {
  // Start scheduled cleanup jobs once when the server process boots.
  scheduleCleanupJobs();
   
  console.log('Media cleanup scheduler initialized');
} catch (err) {
   
  console.error('Failed to initialize media cleanup scheduler', err);
}

export {};
