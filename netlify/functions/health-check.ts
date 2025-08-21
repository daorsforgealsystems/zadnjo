import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    frontend: {
      status: string;
      version: string;
    };
    backend: {
      status: string;
      url: string;
      reachable?: boolean;
    };
  };
  environment: string;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const apiBaseUrl = process.env.API_BASE_URL || 'https://api.daorsflow.com';
    let backendReachable = false;

    // Test backend connectivity
    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Netlify-Function-Health-Check',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      backendReachable = response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      backendReachable = false;
    }

    const healthResponse: HealthResponse = {
      status: backendReachable ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        frontend: {
          status: 'healthy',
          version: process.env.NETLIFY_BUILD_ID || 'unknown',
        },
        backend: {
          status: backendReachable ? 'healthy' : 'unreachable',
          url: apiBaseUrl,
          reachable: backendReachable,
        },
      },
      environment: process.env.CONTEXT || 'production',
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthResponse, null, 2),
    };
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};