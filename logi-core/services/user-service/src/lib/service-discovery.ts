import Consul from 'consul';
import winston from 'winston';

// Configure logger for service discovery
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'service-discovery' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export interface ServiceConfig {
  name: string;
  id?: string;
  address: string;
  port: number;
  tags?: string[];
  meta?: Record<string, string>;
  check?: {
    http?: string;
    tcp?: string;
    interval: string;
    timeout?: string;
    deregisterCriticalServiceAfter?: string;
  };
}

export interface ServiceDiscoveryConfig {
  consulHost?: string;
  consulPort?: number;
  datacenter?: string;
  token?: string;
}

export interface ServiceInstance {
  id: string;
  name: string;
  address: string;
  port: number;
  tags: string[];
  meta: Record<string, string>;
  health: 'passing' | 'warning' | 'critical';
}

export class ServiceDiscovery {
  private consul: Consul;
  private registeredServices: Set<string> = new Set();
  private config: ServiceDiscoveryConfig;

  constructor(config: ServiceDiscoveryConfig = {}) {
    this.config = {
      consulHost: process.env.CONSUL_HOST || '127.0.0.1',
      consulPort: parseInt(process.env.CONSUL_PORT || '8500'),
      datacenter: process.env.CONSUL_DATACENTER || 'dc1',
      ...config
    };

    this.consul = new Consul({
      host: this.config.consulHost,
      port: this.config.consulPort,
      secure: false,
    });

    logger.info('Service Discovery initialized', {
      consulHost: this.config.consulHost,
      consulPort: this.config.consulPort,
      datacenter: this.config.datacenter
    });
  }

  async registerService(serviceConfig: ServiceConfig): Promise<void> {
    try {
      const serviceId = serviceConfig.id || `${serviceConfig.name}-${serviceConfig.port}`;
      
      const registrationConfig: any = {
        name: serviceConfig.name,
        id: serviceId,
        address: serviceConfig.address,
        port: serviceConfig.port,
        tags: serviceConfig.tags || [],
        meta: {
          version: process.env.SERVICE_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          ...serviceConfig.meta
        }
      };

      // Add health check if provided
      if (serviceConfig.check) {
        registrationConfig.check = {
          interval: serviceConfig.check.interval,
          timeout: serviceConfig.check.timeout || '5s',
          deregisterCriticalServiceAfter: serviceConfig.check.deregisterCriticalServiceAfter || '30s'
        };

        if (serviceConfig.check.http) {
          registrationConfig.check.http = serviceConfig.check.http;
        } else if (serviceConfig.check.tcp) {
          registrationConfig.check.tcp = serviceConfig.check.tcp;
        }
      }

      await this.consul.agent.service.register(registrationConfig);
      this.registeredServices.add(serviceId);

      logger.info('Service registered successfully', {
        serviceId,
        serviceName: serviceConfig.name,
        address: serviceConfig.address,
        port: serviceConfig.port
      });

    } catch (error) {
      logger.error('Failed to register service', {
        serviceName: serviceConfig.name,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async deregisterService(serviceId: string): Promise<void> {
    try {
      await this.consul.agent.service.deregister(serviceId);
      this.registeredServices.delete(serviceId);

      logger.info('Service deregistered successfully', { serviceId });

    } catch (error) {
      logger.error('Failed to deregister service', {
        serviceId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async discoverService(serviceName: string, tag?: string): Promise<ServiceInstance[]> {
    try {
      const options: any = {
        service: serviceName,
        passing: true // Only return healthy services
      };

      if (tag) {
        options.tag = tag;
      }

      const result = await this.consul.health.service(options);
      
      const services: ServiceInstance[] = result.map((entry: any) => ({
        id: entry.Service.ID,
        name: entry.Service.Service,
        address: entry.Service.Address,
        port: entry.Service.Port,
        tags: entry.Service.Tags || [],
        meta: entry.Service.Meta || {},
        health: this.getHealthStatus(entry.Checks)
      }));

      logger.debug('Services discovered', {
        serviceName,
        tag,
        count: services.length
      });

      return services;

    } catch (error) {
      logger.error('Failed to discover services', {
        serviceName,
        tag,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getServiceUrl(serviceName: string, tag?: string): Promise<string | null> {
    try {
      const services = await this.discoverService(serviceName, tag);
      
      if (services.length === 0) {
        logger.warn('No healthy services found', { serviceName, tag });
        return null;
      }

      // Simple round-robin selection (in production, use more sophisticated load balancing)
      const selectedService = services[Math.floor(Math.random() * services.length)];
      const url = `http://${selectedService.address}:${selectedService.port}`;

      logger.debug('Service URL selected', {
        serviceName,
        selectedService: selectedService.id,
        url
      });

      return url;

    } catch (error) {
      logger.error('Failed to get service URL', {
        serviceName,
        tag,
        error: (error as Error).message
      });
      return null;
    }
  }

  async watchService(
    serviceName: string,
    callback: (services: ServiceInstance[]) => void,
    tag?: string
  ): Promise<void> {
    try {
      const options: any = {
        service: serviceName,
        passing: true
      };

      if (tag) {
        options.tag = tag;
      }

      const watcher = this.consul.watch({
        method: this.consul.health.service,
        options
      });

      watcher.on('change', (data: any) => {
        const services: ServiceInstance[] = data.map((entry: any) => ({
          id: entry.Service.ID,
          name: entry.Service.Service,
          address: entry.Service.Address,
          port: entry.Service.Port,
          tags: entry.Service.Tags || [],
          meta: entry.Service.Meta || {},
          health: this.getHealthStatus(entry.Checks)
        }));

        logger.debug('Service watch triggered', {
          serviceName,
          tag,
          count: services.length
        });

        callback(services);
      });

      watcher.on('error', (error: Error) => {
        logger.error('Service watch error', {
          serviceName,
          tag,
          error: error.message
        });
      });

      logger.info('Service watch started', { serviceName, tag });

    } catch (error) {
      logger.error('Failed to start service watch', {
        serviceName,
        tag,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async getServiceHealth(serviceId: string): Promise<string> {
    try {
      const result = await this.consul.health.service({
        service: serviceId,
        passing: false // Get all services regardless of health
      });

      if (result.length === 0) {
        return 'not-found';
      }

      const service = result.find((entry: any) => entry.Service.ID === serviceId);
      if (!service) {
        return 'not-found';
      }

      return this.getHealthStatus(service.Checks);

    } catch (error) {
      logger.error('Failed to get service health', {
        serviceId,
        error: (error as Error).message
      });
      return 'unknown';
    }
  }

  async deregisterAllServices(): Promise<void> {
    const promises = Array.from(this.registeredServices).map(serviceId =>
      this.deregisterService(serviceId).catch(error => {
        logger.error('Failed to deregister service during cleanup', {
          serviceId,
          error: error.message
        });
      })
    );

    await Promise.all(promises);
    logger.info('All services deregistered');
  }

  private getHealthStatus(checks: any[]): 'passing' | 'warning' | 'critical' {
    if (!checks || checks.length === 0) {
      return 'passing';
    }

    const statuses = checks.map(check => check.Status);
    
    if (statuses.includes('critical')) {
      return 'critical';
    }
    
    if (statuses.includes('warning')) {
      return 'warning';
    }
    
    return 'passing';
  }

  // Health check method
  async isConsulHealthy(): Promise<boolean> {
    try {
      await this.consul.status.leader();
      return true;
    } catch (error) {
      logger.error('Consul health check failed', {
        error: (error as Error).message
      });
      return false;
    }
  }

  getRegisteredServices(): string[] {
    return Array.from(this.registeredServices);
  }
}

// Factory function to create a configured service discovery instance
export function createServiceDiscovery(config?: ServiceDiscoveryConfig): ServiceDiscovery {
  return new ServiceDiscovery(config);
}

// Utility function to create a standard service configuration
export function createServiceConfig(
  name: string,
  port: number,
  options: Partial<ServiceConfig> = {}
): ServiceConfig {
  const address = options.address || process.env.SERVICE_HOST || '127.0.0.1';
  
  return {
    name,
    port,
    address,
    id: `${name}-${address}-${port}`,
    tags: ['api', 'microservice', ...(options.tags || [])],
    meta: {
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      ...options.meta
    },
    check: {
      http: `http://${address}:${port}/health`,
      interval: '10s',
      timeout: '5s',
      deregisterCriticalServiceAfter: '30s',
      ...options.check
    },
    ...options
  };
}