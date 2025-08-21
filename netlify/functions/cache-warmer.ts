import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface CacheWarmerResponse {
  status: string;
  timestamp: string;
  warmed: string[];
  failed: string[];
  duration: number;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const startTime = Date.now();
  const apiBaseUrl = process.env.API_BASE_URL || 'https://api.daorsflow.com';
  
  // Common API endpoints to warm up
  const endpointsToWarm = [
    '/health',
    '/readyz',
    '/api/v1/users/profile',
    '/api/v1/inventory/summary',
    '/api/v1/orders/recent',
    '/preferences/layout/no-session-guest',
  ];

  const warmed: string[] = [];
  const failed: string[] = [];

  // Warm up endpoints concurrently
  await Promise.allSettled(
    endpointsToWarm.map(async (endpoint) => {
      try {
        const url = `${apiBaseUrl}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Netlify-Function-Cache-Warmer',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (response.ok) {
          warmed.push(endpoint);
        } else {
          failed.push(`${endpoint} (${response.status})`);
        }
      } catch (error) {
        console.warn(`Failed to warm ${endpoint}:`, error);
        failed.push(`${endpoint} (error)`);
      }
    })
  );

  const duration = Date.now() - startTime;

  const response: CacheWarmerResponse = {
    status: failed.length === 0 ? 'success' : 'partial',
    timestamp: new Date().toISOString(),
    warmed,
    failed,
    duration,
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(response, null, 2),
  };
};