#!/usr/bin/env node
/**
 * Monthly Cleanup Runner - Scheduled task for auto-cleanup
 * Deletes media only from out-of-stock products
 * Can be scheduled via cron, GitHub Actions, or server cron
 * 
 * Setup cron job (Linux/Mac):
 * 0 2 1 * * cd /path/to/Pc-Studio && node scripts/monthly-cleanup-runner.js >> cleanup.log 2>&1
 * (Runs on 1st day of month at 2 AM)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'safe-cleanup-outofstock.js');
const LOG_DIR = path.join(__dirname, '..', '.cleanup-logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(LOG_DIR, `cleanup-${timestamp}.log`);

console.log(`🗓️ Monthly Cleanup Scheduled Task`);
console.log(`📅 Timestamp: ${new Date().toISOString()}`);
console.log(`📝 Log file: ${logFile}\n`);

// Run the cleanup script
const cleanup = spawn('node', [SCRIPT_PATH], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env }
});

let output = '';
let errorOutput = '';

cleanup.stdout.on('data', (data) => {
  const text = data.toString();
  process.stdout.write(text);
  output += text;
});

cleanup.stderr.on('data', (data) => {
  const text = data.toString();
  process.stderr.write(text);
  errorOutput += text;
});

cleanup.on('close', (code) => {
  // Log results
  const fullLog = `
Cleanup Task Executed
Timestamp: ${new Date().toISOString()}
Exit Code: ${code}
Status: ${code === 0 ? '✅ SUCCESS' : '❌ FAILED'}

=== OUTPUT ===
${output}

${errorOutput ? `=== ERRORS ===\n${errorOutput}` : ''}
`;

  fs.writeFileSync(logFile, fullLog);

  if (code === 0) {
    console.log(`\n✅ Cleanup task completed successfully`);
    console.log(`📝 Results saved to: ${logFile}`);
  } else {
    console.log(`\n❌ Cleanup task failed with exit code ${code}`);
    console.log(`📝 Details saved to: ${logFile}`);
  }

  process.exit(code);
});
