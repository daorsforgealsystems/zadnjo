import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

interface AnalyticsResponse {
  status: string;
  timestamp: string;
  processed: number;
  errors?: string[];
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

  try {
    const body = JSON.parse(event.body || '{}');
    const events: AnalyticsEvent[] = Array.isArray(body) ? body : [body];
    
    if (events.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No events provided' }),
      };
    }

    const errors: string[] = [];
    let processed = 0;

    // Process each analytics event
    for (const analyticsEvent of events) {
      try {
        // Validate event structure
        if (!analyticsEvent.event || typeof analyticsEvent.event !== 'string') {
          errors.push('Invalid event name');
          continue;
        }

        // Enrich event with metadata
        const enrichedEvent = {
          ...analyticsEvent,
          timestamp: analyticsEvent.timestamp || new Date().toISOString(),
          source: 'netlify-function',
          environment: process.env.CONTEXT || 'production',
          userAgent: event.headers['user-agent'],
          ip: event.headers['x-forwarded-for'] || event.headers['client-ip'],
          referer: event.headers.referer,
        };

        // Log to console for now (in production, send to analytics service)
        console.log('Analytics Event:', JSON.stringify(enrichedEvent));

        // In a real implementation, you would send this to your analytics service
        // await sendToAnalyticsService(enrichedEvent);

        processed++;
      } catch (error) {
        console.error('Error processing analytics event:', error);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    const response: AnalyticsResponse = {
      status: errors.length === 0 ? 'success' : 'partial',
      timestamp: new Date().toISOString(),
      processed,
      ...(errors.length > 0 && { errors }),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Analytics function error:', error);
    
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