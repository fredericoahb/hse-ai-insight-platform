import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Channel, Connection, connect } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleDestroy {
  private connection?: Connection;
  private channel?: Channel;
  private readonly url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  private readonly queue = process.env.RABBITMQ_QUEUE ?? 'hse.reports';

  private async ensureChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    this.connection = await connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queue, { durable: true });
    return this.channel;
  }

  async publish(payload: Record<string, unknown>): Promise<void> {
    const channel = await this.ensureChannel();
    channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
    });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
