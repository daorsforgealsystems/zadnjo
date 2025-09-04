export default async (request, context) => {
  const url = new URL(request.url);
  const { pathname } = url;

  // Log the request for debugging
  console.log(`Edge function: ${request.method} ${pathname}`);

  // Handle API routes - proxy to backend
  if (pathname.startsWith('/api/')) {
    // Remove /api prefix for backend routing
    const backendPath = pathname.replace('/api', '');

    // Add geo-location headers for backend processing
    const geo = context.geo || {};
    const headers = new Headers(request.headers);

    // Add geo information headers
    if (geo.city) headers.set('X-Client-City', geo.city);
    if (geo.country) headers.set('X-Client-Country', geo.country.code);
    if (geo.region) headers.set('X-Client-Region', geo.region);
    if (geo.timezone) headers.set('X-Client-Timezone', geo.timezone);

    // Add request metadata
    headers.set('X-Forwarded-Host', url.hostname);
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
    headers.set('X-Real-IP', context.ip);

    try {
      // Proxy the request to the backend API
      const backendUrl = `https://api.flowmotion.com${backendPath}${url.search}`;

      console.log(`Proxying to: ${backendUrl}`);

      const response = await fetch(backendUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      // Add CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      };

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: corsHeaders
        });
      }

      // Create response with CORS headers
      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (error) {
      console.error('Edge function error:', error);

      // Return error response
      return new Response(JSON.stringify({
        error: 'Service temporarily unavailable',
        message: 'The API service is currently experiencing issues. Please try again later.',
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    }
  }

  // For non-API routes, continue to the next handler
  return context.next();
};

// Handle edge function configuration
export const config = {
  path: '/api/*'
};