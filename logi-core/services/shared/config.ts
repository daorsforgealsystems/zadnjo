import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
// Optional YAML support; parse only if dependency is present
let yamlParser: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  yamlParser = require('yaml');
} catch (err) {
  // yaml not installed; YAML files will not be supported until dependency is added
  yamlParser = null;
}

// Configure logger for configuration management
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'config' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    default?: any;
    validation?: (value: any) => boolean;
    description?: string;
    sensitive?: boolean; // For masking in logs
  };
}

export interface ConfigOptions {
  envPrefix?: string;
  configFile?: string;
  schema?: ConfigSchema;
  validateOnLoad?: boolean;
  watchForChanges?: boolean;
}

export class ConfigurationManager {
  private config: Record<string, any> = {};
  private schema: ConfigSchema;
  private options: ConfigOptions;
  private watchers: Map<string, fs.FSWatcher> = new Map();

  constructor(options: ConfigOptions = {}) {
    this.options = {
      envPrefix: 'APP_',
      validateOnLoad: true,
      watchForChanges: false,
      ...options
    };

    this.schema = options.schema || {};
    this.loadConfiguration();

    if (this.options.validateOnLoad) {
      this.validateConfiguration();
    }

    if (this.options.watchForChanges && this.options.configFile) {
      this.watchConfigFile();
    }
  }

  private loadConfiguration(): void {
    try {
      // Load from environment variables
      this.loadFromEnvironment();

      // Load from config file if specified
      if (this.options.configFile) {
        this.loadFromFile(this.options.configFile);
      }

      // Apply defaults from schema
      this.applyDefaults();

      logger.info('Configuration loaded successfully', {
        sources: this.getConfigSources(),
        keys: Object.keys(this.config).length
      });

    } catch (error) {
      logger.error('Failed to load configuration', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  private loadFromEnvironment(): void {
    const envPrefix = this.options.envPrefix || '';
    
    Object.keys(process.env).forEach(key => {
      if (key.startsWith(envPrefix)) {
        const configKey = key.substring(envPrefix.length).toLowerCase();
        const value = this.parseEnvironmentValue(process.env[key]!);
        this.config[configKey] = value;
      }
    });

    logger.debug('Loaded configuration from environment variables', {
      count: Object.keys(this.config).length
    });
  }

  private loadFromFile(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) {
        logger.warn('Configuration file not found', { filePath });
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fileConfig = this.parseConfigFile(filePath, fileContent);

      // Merge file config with existing config (env vars take precedence)
      Object.keys(fileConfig).forEach(key => {
        if (!(key in this.config)) {
          this.config[key] = fileConfig[key];
        }
      });

      logger.debug('Loaded configuration from file', {
        filePath,
        keys: Object.keys(fileConfig).length
      });

    } catch (error) {
      logger.error('Failed to load configuration file', {
        filePath,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private parseConfigFile(filePath: string, content: string): Record<string, any> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
        return JSON.parse(content);
      
      case '.yaml':
      case '.yml':
        if (!yamlParser) {
          throw new Error('YAML configuration files require the "yaml" package to be installed');
        }
        return yamlParser.parse(content);
      
      case '.env':
        return this.parseEnvFile(content);
      
      default:
        throw new Error(`Unsupported configuration file format: ${ext}`);
    }
  }

  private parseEnvFile(content: string): Record<string, any> {
    const config: Record<string, any> = {};
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        return;
      }

      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) {
        logger.warn('Invalid line in env file', { line: index + 1, content: line });
        return;
      }

      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      const unquotedValue = value.replace(/^["']|["']$/g, '');
      config[key.toLowerCase()] = this.parseEnvironmentValue(unquotedValue);
    });

    return config;
  }

  private parseEnvironmentValue(value: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // Not JSON, return as string
      return value;
    }
  }

  private applyDefaults(): void {
    Object.entries(this.schema).forEach(([key, schemaItem]) => {
      if (!(key in this.config) && schemaItem.default !== undefined) {
        this.config[key] = schemaItem.default;
        logger.debug('Applied default value', { key, default: schemaItem.default });
      }
    });
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    Object.entries(this.schema).forEach(([key, schemaItem]) => {
      const value = this.config[key];

      // Check required fields
      if (schemaItem.required && (value === undefined || value === null)) {
        errors.push(`Required configuration key '${key}' is missing`);
        return;
      }

      // Skip validation if value is undefined and not required
      if (value === undefined) {
        return;
      }

      // Type validation
      if (!this.validateType(value, schemaItem.type)) {
        errors.push(`Configuration key '${key}' has invalid type. Expected ${schemaItem.type}, got ${typeof value}`);
      }

      // Custom validation
      if (schemaItem.validation && !schemaItem.validation(value)) {
        errors.push(`Configuration key '${key}' failed custom validation`);
      }
    });

    if (errors.length > 0) {
      logger.error('Configuration validation failed', { errors });
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    logger.info('Configuration validation passed');
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private watchConfigFile(): void {
    if (!this.options.configFile) {
      return;
    }

    try {
      const watcher = fs.watch(this.options.configFile, (eventType) => {
        if (eventType === 'change') {
          logger.info('Configuration file changed, reloading', {
            file: this.options.configFile
          });
          
          try {
            this.loadConfiguration();
            if (this.options.validateOnLoad) {
              this.validateConfiguration();
            }
            logger.info('Configuration reloaded successfully');
          } catch (error) {
            logger.error('Failed to reload configuration', {
              error: (error as Error).message
            });
          }
        }
      });

      this.watchers.set(this.options.configFile, watcher);
      logger.info('Watching configuration file for changes', {
        file: this.options.configFile
      });

    } catch (error) {
      logger.error('Failed to watch configuration file', {
        file: this.options.configFile,
        error: (error as Error).message
      });
    }
  }

  // Public API
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    const value = this.config[key];
    return value !== undefined ? value : defaultValue;
  }

  set(key: string, value: any): void {
    this.config[key] = value;
    logger.debug('Configuration value updated', { key });
  }

  has(key: string): boolean {
    return key in this.config;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  getAllMasked(): Record<string, any> {
    const masked: Record<string, any> = {};
    
    Object.entries(this.config).forEach(([key, value]) => {
      const schemaItem = this.schema[key];
      if (schemaItem?.sensitive) {
        masked[key] = '***';
      } else {
        masked[key] = value;
      }
    });

    return masked;
  }

  reload(): void {
    logger.info('Manually reloading configuration');
    this.config = {};
    this.loadConfiguration();
    
    if (this.options.validateOnLoad) {
      this.validateConfiguration();
    }
  }

  destroy(): void {
    // Stop watching files
    this.watchers.forEach((watcher, filePath) => {
      watcher.close();
      logger.debug('Stopped watching configuration file', { filePath });
    });
    this.watchers.clear();
  }

  // Utility methods
  private getConfigSources(): string[] {
    const sources = ['environment'];
    if (this.options.configFile) {
      sources.push('file');
    }
    if (Object.keys(this.schema).length > 0) {
      sources.push('defaults');
    }
    return sources;
  }

  getConfigInfo(): any {
    return {
      sources: this.getConfigSources(),
      keyCount: Object.keys(this.config).length,
      schemaKeys: Object.keys(this.schema).length,
      options: {
        envPrefix: this.options.envPrefix,
        configFile: this.options.configFile,
        validateOnLoad: this.options.validateOnLoad,
        watchForChanges: this.options.watchForChanges
      }
    };
  }
}

// Predefined configuration schemas for different services
export const ApiGatewayConfigSchema: ConfigSchema = {
  port: {
    type: 'number',
    required: true,
    default: 8080,
    description: 'Port for the API Gateway to listen on'
  },
  log_level: {
    type: 'string',
    default: 'info',
    validation: (value) => ['error', 'warn', 'info', 'debug'].includes(value),
    description: 'Logging level'
  },
  rate_limit_window_ms: {
    type: 'number',
    default: 60000,
    description: 'Rate limiting window in milliseconds'
  },
  rate_limit_max_requests: {
    type: 'number',
    default: 100,
    description: 'Maximum requests per window'
  },
  circuit_breaker_timeout: {
    type: 'number',
    default: 3000,
    description: 'Circuit breaker timeout in milliseconds'
  },
  circuit_breaker_error_threshold: {
    type: 'number',
    default: 50,
    description: 'Circuit breaker error threshold percentage'
  },
  circuit_breaker_reset_timeout: {
    type: 'number',
    default: 10000,
    description: 'Circuit breaker reset timeout in milliseconds'
  }
};

export const DatabaseConfigSchema: ConfigSchema = {
  database_url: {
    type: 'string',
    required: true,
    default: 'postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres',
    sensitive: true,
    description: 'Supabase database connection URL'
  },
  db_ssl: {
    type: 'boolean',
    default: true,
    description: 'Enable SSL for database connections'
  },
  supabase_url: {
    type: 'string',
    required: true,
    default: 'https://your-project-id.supabase.co',
    description: 'Supabase project URL'
  },
  supabase_anon_key: {
    type: 'string',
    required: true,
    sensitive: true,
    description: 'Supabase anonymous key'
  },
  supabase_service_role_key: {
    type: 'string',
    required: true,
    sensitive: true,
    description: 'Supabase service role key'
  }
};

export const RedisConfigSchema: ConfigSchema = {
  redis_host: {
    type: 'string',
    default: '127.0.0.1',
    description: 'Redis host'
  },
  redis_port: {
    type: 'number',
    default: 6379,
    description: 'Redis port'
  },
  redis_password: {
    type: 'string',
    sensitive: true,
    description: 'Redis password'
  },
  redis_db: {
    type: 'number',
    default: 0,
    description: 'Redis database number'
  },
  redis_key_prefix: {
    type: 'string',
    default: 'logi:',
    description: 'Redis key prefix'
  }
};

export const MessageQueueConfigSchema: ConfigSchema = {
  rabbitmq_url: {
    type: 'string',
    required: true,
    default: 'amqp://localhost:5672',
    sensitive: true,
    description: 'RabbitMQ connection URL'
  },
  rabbitmq_retry_attempts: {
    type: 'number',
    default: 3,
    description: 'Number of retry attempts for message publishing'
  },
  rabbitmq_retry_delay: {
    type: 'number',
    default: 1000,
    description: 'Delay between retry attempts in milliseconds'
  }
};

export const ServiceDiscoveryConfigSchema: ConfigSchema = {
  consul_host: {
    type: 'string',
    default: '127.0.0.1',
    description: 'Consul host'
  },
  consul_port: {
    type: 'number',
    default: 8500,
    description: 'Consul port'
  },
  consul_datacenter: {
    type: 'string',
    default: 'dc1',
    description: 'Consul datacenter'
  },
  service_name: {
    type: 'string',
    required: true,
    description: 'Service name for registration'
  },
  service_version: {
    type: 'string',
    default: '1.0.0',
    description: 'Service version'
  },
  service_host: {
    type: 'string',
    default: '127.0.0.1',
    description: 'Service host for registration'
  }
};

// Factory functions
export function createApiGatewayConfig(options?: ConfigOptions): ConfigurationManager {
  return new ConfigurationManager({
    schema: ApiGatewayConfigSchema,
    envPrefix: 'GATEWAY_',
    ...options
  });
}

export function createServiceConfig(serviceName: string, options?: ConfigOptions): ConfigurationManager {
  const combinedSchema = {
    ...DatabaseConfigSchema,
    ...RedisConfigSchema,
    ...MessageQueueConfigSchema,
    ...ServiceDiscoveryConfigSchema
  };

  return new ConfigurationManager({
    schema: combinedSchema,
    envPrefix: `${serviceName.toUpperCase()}_`,
    ...options
  });
}

export function createConfigurationManager(options: ConfigOptions): ConfigurationManager {
  return new ConfigurationManager(options);
}