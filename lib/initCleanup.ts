import { scheduleCleanupJobs } from './mediaCleanup';

try {
  // Start scheduled cleanup jobs once when the server process boots.
  scheduleCleanupJobs();
  // eslint-disable-next-line no-console
  console.log('Media cleanup scheduler initialized');
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize media cleanup scheduler', err);
}

export {};
