import amqp, { Connection, Channel, Message } from 'amqplib';
import winston from 'winston';

// Configure logger for message queue
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'message-queue' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export interface MessageQueueConfig {
  url: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: any;
}

export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  expiration?: string;
  messageId?: string;
  correlationId?: string;
  replyTo?: string;
}

export interface ConsumeOptions {
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
  consumerTag?: string;
}

export class MessageQueue {
  private connection: any = null;
  private channel: any = null;
  private config: MessageQueueConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;

  constructor(config: MessageQueueConfig) {
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  async connect(): Promise<void> {
    try {
      logger.info('Connecting to RabbitMQ', { url: this.config.url });
      
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel() as Channel;

      // Handle connection events
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error', { error: error.message });
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleConnectionClose();
      });

      // Handle channel events
      this.channel.on('error', (error) => {
        logger.error('RabbitMQ channel error', { error: error.message });
      });

      this.channel.on('close', () => {
        logger.warn('RabbitMQ channel closed');
      });

      logger.info('Successfully connected to RabbitMQ');
      this.reconnectAttempts = 0;

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { 
        error: (error as Error).message,
        attempt: this.reconnectAttempts + 1
      });
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay);
      } else {
        throw new Error(`Failed to connect to RabbitMQ after ${this.maxReconnectAttempts} attempts`);
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', { 
        error: (error as Error).message 
      });
    }
  }

  async assertQueue(queueName: string, options: QueueOptions = {}): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available. Call connect() first.');
    }

    const queueOptions = {
      durable: true,
      exclusive: false,
      autoDelete: false,
      ...options
    };

    try {
      await this.channel.assertQueue(queueName, queueOptions);
      logger.debug('Queue asserted', { queue: queueName, options: queueOptions });
    } catch (error) {
      logger.error('Failed to assert queue', { 
        queue: queueName, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async publish(
    queueName: string, 
    message: any, 
    options: PublishOptions = {}
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Channel not available. Call connect() first.');
    }

    const publishOptions = {
      persistent: true,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...options
    };

    try {
      const messageBuffer = Buffer.from(JSON.stringify({
        data: message,
        metadata: {
          publishedAt: new Date().toISOString(),
          messageId: publishOptions.messageId,
          correlationId: publishOptions.correlationId
        }
      }));

      const result = this.channel.sendToQueue(queueName, messageBuffer, publishOptions);
      
      logger.debug('Message published', { 
        queue: queueName, 
        messageId: publishOptions.messageId,
        size: messageBuffer.length
      });

      return result;
    } catch (error) {
      logger.error('Failed to publish message', { 
        queue: queueName, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async consume(
    queueName: string,
    handler: (message: any, metadata: any) => Promise<void>,
    options: ConsumeOptions = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available. Call connect() first.');
    }

    const consumeOptions = {
      noAck: false,
      ...options
    };

    try {
      await this.channel.consume(queueName, async (msg: Message | null) => {
        if (!msg) {
          logger.warn('Received null message', { queue: queueName });
          return;
        }

        try {
          const messageContent = JSON.parse(msg.content.toString());
          const { data, metadata } = messageContent;

          logger.debug('Message received', { 
            queue: queueName, 
            messageId: metadata?.messageId,
            correlationId: metadata?.correlationId
          });

          await handler(data, metadata);

          if (!consumeOptions.noAck && this.channel) {
            this.channel.ack(msg);
            logger.debug('Message acknowledged', { 
              queue: queueName, 
              messageId: metadata?.messageId 
            });
          }

        } catch (error) {
          logger.error('Error processing message', { 
            queue: queueName, 
            error: (error as Error).message 
          });

          if (!consumeOptions.noAck && this.channel) {
            // Reject and requeue the message for retry
            this.channel.nack(msg, false, true);
          }
        }
      }, consumeOptions);

      logger.info('Consumer started', { queue: queueName });

    } catch (error) {
      logger.error('Failed to start consumer', { 
        queue: queueName, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  async publishWithRetry(
    queueName: string, 
    message: any, 
    options: PublishOptions = {}
  ): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = this.config.retryAttempts || 3;

    while (attempts < maxAttempts) {
      try {
        return await this.publish(queueName, message, options);
      } catch (error) {
        attempts++;
        logger.warn('Publish attempt failed', { 
          queue: queueName, 
          attempt: attempts, 
          maxAttempts,
          error: (error as Error).message 
        });

        if (attempts >= maxAttempts) {
          throw error;
        }

        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay || 1000)
        );
      }
    }

    return false;
  }

  private handleConnectionError(): void {
    this.connection = null;
    this.channel = null;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private handleConnectionClose(): void {
    this.connection = null;
    this.channel = null;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  // Health check method
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  getConnectionInfo(): any {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Event types for the logistics platform
export enum LogisticsEvents {
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  SHIPMENT_CREATED = 'shipment.created',
  SHIPMENT_UPDATED = 'shipment.updated',
  SHIPMENT_DELIVERED = 'shipment.delivered',
  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  ROUTE_OPTIMIZED = 'route.optimized',
  VEHICLE_LOCATION_UPDATED = 'vehicle.location_updated',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  NOTIFICATION_SEND = 'notification.send'
}

// Factory function to create a configured message queue instance
export function createMessageQueue(config?: Partial<MessageQueueConfig>): MessageQueue {
  const defaultConfig: MessageQueueConfig = {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    retryAttempts: 3,
    retryDelay: 1000
  };

  return new MessageQueue({ ...defaultConfig, ...config });
}