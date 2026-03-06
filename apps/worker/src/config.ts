export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/hse_ai',
  rabbitUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  queue: process.env.RABBITMQ_QUEUE ?? 'hse.reports',
  opensearchNode: process.env.OPENSEARCH_NODE ?? 'http://localhost:9200',
  opensearchIndex: process.env.OPENSEARCH_INDEX ?? 'hse-incidents',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen2:7b',
  aiFallbackEnabled: (process.env.AI_FALLBACK_ENABLED ?? 'true').toLowerCase() === 'true',
};
