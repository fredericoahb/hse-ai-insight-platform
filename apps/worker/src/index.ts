import amqp, { ConsumeMessage } from 'amqplib';
import { config } from './config';
import { analyzeWithOllama } from './services/ollama';
import { fallbackAnalyze } from './services/fallback-ai';
import { ensureIndex, indexIncident } from './services/opensearch';
import { markFailed, markProcessed, markProcessing, pool } from './services/db';
import { IncidentMessage } from './types';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyze(reportText: string) {
  try {
    return await analyzeWithOllama(reportText);
  } catch (error) {
    if (!config.aiFallbackEnabled) {
      throw error;
    }

    console.warn('Falling back to deterministic extractor:', (error as Error).message);
    return fallbackAnalyze(reportText);
  }
}

async function handleMessage(message: ConsumeMessage | null, ack: () => void, nack: () => void) {
  if (!message) return;

  let payload: IncidentMessage;
  try {
    payload = JSON.parse(message.content.toString('utf-8'));
  } catch (error) {
    console.error('Invalid queue message:', error);
    ack();
    return;
  }

  try {
    await markProcessing(payload.incidentId);
    const extraction = await analyze(payload.reportText);
    await markProcessed(payload.incidentId, extraction);
    await indexIncident(payload.incidentId, payload.reportText, extraction);
    console.log(`Processed incident ${payload.incidentId}`);
    ack();
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown processing error';
    console.error(`Failed incident ${payload.incidentId}:`, messageText);
    await markFailed(payload.incidentId, messageText);
    nack();
  }
}

async function bootstrap() {
  await ensureIndex();

  while (true) {
    try {
      const connection = await amqp.connect(config.rabbitUrl);
      const channel = await connection.createChannel();
      await channel.assertQueue(config.queue, { durable: true });
      await channel.prefetch(1);

      console.log(`Worker connected. Waiting for messages on ${config.queue}`);

      channel.consume(config.queue, (msg) => {
        handleMessage(
          msg,
          () => msg && channel.ack(msg),
          () => msg && channel.nack(msg, false, false),
        );
      });

      process.on('SIGINT', async () => {
        await channel.close();
        await connection.close();
        await pool.end();
        process.exit(0);
      });

      break;
    } catch (error) {
      console.error('Worker bootstrap failed, retrying in 5s:', error);
      await sleep(5000);
    }
  }
}

bootstrap().catch(async (error) => {
  console.error('Fatal worker error:', error);
  await pool.end();
  process.exit(1);
});
