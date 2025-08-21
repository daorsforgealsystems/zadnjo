import { Pool, PoolClient, QueryResult } from 'pg';
import winston from 'winston';

// Configure logger for database operations
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
  max?: number; // Maximum number of clients in the pool
  min?: number; // Minimum number of clients in the pool
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  maxUses?: number; // Maximum number of times a client can be used
  allowExitOnIdle?: boolean;
  application_name?: string;
}

export interface QueryOptions {
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  logQuery?: boolean;
}

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  readOnly?: boolean;
  deferrable?: boolean;
}

export interface QueryStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageExecutionTime: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

export class DatabaseService {
  private pool: Pool;
  private config: DatabaseConfig;
  private queryCache: Map<string, { result: any; timestamp: number; ttl: number }> = new Map();
  private stats: QueryStats = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageExecutionTime: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private executionTimes: number[] = [];

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'logistics',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true',
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
      maxUses: parseInt(process.env.DB_MAX_USES || '7500'),
      allowExitOnIdle: process.env.DB_ALLOW_EXIT_ON_IDLE === 'true',
      application_name: process.env.SERVICE_NAME || 'logistics-service',
      ...config
    };

    this.initializePool();
  }

  private initializePool(): void {
    try {
      this.pool = new Pool(this.config);

      // Pool event handlers
      this.pool.on('connect', (client) => {
        logger.debug('New database client connected', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        });
      });

      this.pool.on('acquire', (client) => {
        logger.debug('Database client acquired from pool', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount
        });
      });

      this.pool.on('remove', (client) => {
        logger.debug('Database client removed from pool', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount
        });
      });

      this.pool.on('error', (error, client) => {
        logger.error('Database pool error', {
          error: error.message,
          stack: error.stack
        });
      });

      logger.info('Database pool initialized', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        maxConnections: this.config.max,
        minConnections: this.config.min
      });

    } catch (error) {
      logger.error('Failed to initialize database pool', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async query<T = any>(
    text: string, 
    params?: any[], 
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryId = this.generateQueryId(text, params);
    
    this.stats.totalQueries++;

    try {
      // Check cache first if caching is enabled
      if (options.cache && this.isSelectQuery(text)) {
        const cached = this.getCachedResult(queryId);
        if (cached) {
          this.stats.cacheHits++;
          logger.debug('Query cache hit', { queryId });
          return cached;
        }
        this.stats.cacheMisses++;
      }

      // Log query if enabled
      if (options.logQuery !== false) {
        logger.debug('Executing query', {
          queryId,
          text: this.sanitizeQuery(text),
          params: params?.length || 0
        });
      }

      // Execute query with timeout
      const client = await this.pool.connect();
      let result: QueryResult<T>;

      try {
        if (options.timeout) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), options.timeout);
          });
          
          result = await Promise.race([
            client.query(text, params),
            timeoutPromise
          ]);
        } else {
          result = await client.query(text, params);
        }
      } finally {
        client.release();
      }

      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, true);

      // Cache result if caching is enabled and it's a SELECT query
      if (options.cache && this.isSelectQuery(text)) {
        this.cacheResult(queryId, result, options.cacheTTL || 300000); // Default 5 minutes
      }

      logger.debug('Query executed successfully', {
        queryId,
        executionTime,
        rowCount: result.rowCount
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateStats(executionTime, false);

      logger.error('Query execution failed', {
        queryId,
        error: (error as Error).message,
        executionTime,
        text: this.sanitizeQuery(text)
      });

      // Retry logic
      if (options.retries && options.retries > 0) {
        logger.info('Retrying query', { queryId, retriesLeft: options.retries });
        return this.query(text, params, { ...options, retries: options.retries - 1 });
      }

      throw error;
    }
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');

      // Set transaction options
      if (options.isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }
      if (options.readOnly) {
        await client.query('SET TRANSACTION READ ONLY');
      }
      if (options.deferrable) {
        await client.query('SET TRANSACTION DEFERRABLE');
      }

      logger.debug('Transaction started', { options });

      const result = await callback(client);

      await client.query('COMMIT');
      
      const executionTime = Date.now() - startTime;
      logger.debug('Transaction committed', { executionTime });

      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      
      const executionTime = Date.now() - startTime;
      logger.error('Transaction rolled back', {
        error: (error as Error).message,
        executionTime
      });

      throw error;
    } finally {
      client.release();
    }
  }

  // Batch operations
  async batchInsert<T>(
    table: string,
    columns: string[],
    values: T[][],
    options: { batchSize?: number; onConflict?: string } = {}
  ): Promise<void> {
    const batchSize = options.batchSize || 1000;
    const onConflict = options.onConflict || '';

    logger.info('Starting batch insert', {
      table,
      totalRows: values.length,
      batchSize,
      columns: columns.length
    });

    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      const placeholders = batch.map((_, batchIndex) => {
        const rowPlaceholders = columns.map((_, colIndex) => 
          `$${batchIndex * columns.length + colIndex + 1}`
        ).join(', ');
        return `(${rowPlaceholders})`;
      }).join(', ');

      const query = `
        INSERT INTO ${table} (${columns.join(', ')}) 
        VALUES ${placeholders}
        ${onConflict}
      `;

      const flatValues = batch.flat();

      await this.query(query, flatValues, { logQuery: false });

      logger.debug('Batch inserted', {
        table,
        batchNumber: Math.floor(i / batchSize) + 1,
        rowsInBatch: batch.length
      });
    }

    logger.info('Batch insert completed', {
      table,
      totalRows: values.length
    });
  }

  // Query builder helpers
  buildSelectQuery(options: {
    table: string;
    columns?: string[];
    where?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    offset?: number;
    joins?: Array<{ type: string; table: string; on: string }>;
  }): { text: string; params: any[] } {
    const { table, columns = ['*'], where = {}, orderBy, limit, offset, joins = [] } = options;
    
    let query = `SELECT ${columns.join(', ')} FROM ${table}`;
    const params: any[] = [];
    let paramIndex = 1;

    // Add joins
    joins.forEach(join => {
      query += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    });

    // Add WHERE clause
    const whereConditions = Object.entries(where).map(([key, value]) => {
      params.push(value);
      return `${key} = $${paramIndex++}`;
    });

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    // Add LIMIT and OFFSET
    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    return { text: query, params };
  }

  buildUpdateQuery(
    table: string,
    updates: Record<string, any>,
    where: Record<string, any>
  ): { text: string; params: any[] } {
    const params: any[] = [];
    let paramIndex = 1;

    const setClause = Object.entries(updates).map(([key, value]) => {
      params.push(value);
      return `${key} = $${paramIndex++}`;
    }).join(', ');

    const whereClause = Object.entries(where).map(([key, value]) => {
      params.push(value);
      return `${key} = $${paramIndex++}`;
    }).join(' AND ');

    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;

    return { text: query, params };
  }

  buildInsertQuery(
    table: string,
    data: Record<string, any>,
    options: { onConflict?: string; returning?: string } = {}
  ): { text: string; params: any[] } {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    if (options.onConflict) {
      query += ` ${options.onConflict}`;
    }

    if (options.returning) {
      query += ` RETURNING ${options.returning}`;
    }

    return { text: query, params: values };
  }

  // Health and monitoring
  async getPoolStats(): Promise<any> {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      config: {
        max: this.config.max,
        min: this.config.min,
        idleTimeoutMillis: this.config.idleTimeoutMillis
      }
    };
  }

  getQueryStats(): QueryStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.executionTimes = [];
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check', [], { timeout: 5000 });
      return result.rows[0]?.health_check === 1;
    } catch (error) {
      logger.error('Database health check failed', {
        error: (error as Error).message
      });
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database pool closed');
    } catch (error) {
      logger.error('Error closing database pool', {
        error: (error as Error).message
      });
    }
  }

  // Private helper methods
  private generateQueryId(text: string, params?: any[]): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(text + JSON.stringify(params || []))
      .digest('hex');
    return hash.substring(0, 8);
  }

  private isSelectQuery(text: string): boolean {
    return text.trim().toLowerCase().startsWith('select');
  }

  private sanitizeQuery(text: string): string {
    // Remove sensitive data from query for logging
    return text.replace(/password\s*=\s*'[^']*'/gi, "password='***'");
  }

  private getCachedResult(queryId: string): any | null {
    const cached = this.queryCache.get(queryId);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result;
    }
    if (cached) {
      this.queryCache.delete(queryId);
    }
    return null;
  }

  private cacheResult(queryId: string, result: any, ttl: number): void {
    this.queryCache.set(queryId, {
      result,
      timestamp: Date.now(),
      ttl
    });

    // Clean up old cache entries periodically
    if (this.queryCache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  private updateStats(executionTime: number, success: boolean): void {
    this.executionTimes.push(executionTime);
    
    if (success) {
      this.stats.successfulQueries++;
    } else {
      this.stats.failedQueries++;
    }

    // Track slow queries (> 1 second)
    if (executionTime > 1000) {
      this.stats.slowQueries++;
    }

    // Calculate average execution time
    if (this.executionTimes.length > 100) {
      this.executionTimes = this.executionTimes.slice(-100); // Keep last 100
    }
    
    this.stats.averageExecutionTime = 
      this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length;
  }
}

// Factory function to create a configured database service
export function createDatabaseService(config?: DatabaseConfig): DatabaseService {
  return new DatabaseService(config);
}

// Migration runner
export class MigrationRunner {
  constructor(private db: DatabaseService) {}

  async runMigrations(migrationsPath: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');

    // Create migrations table if it doesn't exist
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executedResult = await this.db.query(
      'SELECT filename FROM migrations ORDER BY id'
    );
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename));

    // Get migration files
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter((file: string) => file.endsWith('.sql'))
      .sort();

    logger.info('Starting migrations', {
      totalMigrations: migrationFiles.length,
      executedMigrations: executedMigrations.size
    });

    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        logger.debug('Skipping already executed migration', { filename });
        continue;
      }

      const filePath = path.join(migrationsPath, filename);
      const sql = fs.readFileSync(filePath, 'utf8');

      await this.db.transaction(async (client) => {
        logger.info('Executing migration', { filename });
        
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        );

        logger.info('Migration completed', { filename });
      });
    }

    logger.info('All migrations completed');
  }
}