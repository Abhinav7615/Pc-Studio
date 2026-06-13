import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN is required to set up the Telegram webhook.');
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram-webhook`;
  const params = new URLSearchParams({ url: webhookUrl });
  if (webhookSecret) {
    params.append('secret_token', webhookSecret);
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?${params.toString()}`);
  const result = await response.json();
  console.log('Telegram setWebhook response:', result);
}

run().catch((error) => {
  console.error('Failed to set Telegram webhook:', error);
  process.exit(1);
});
