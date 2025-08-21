import type { Context } from "https://edge.netlify.com";

interface GeoLocation {
  country: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

interface GeoResponse {
  location: GeoLocation;
  recommendedEndpoint: string;
  timestamp: string;
  processingTime: number;
}

export default async (request: Request, context: Context) => {
  const startTime = Date.now();
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Extract geolocation from Netlify Edge context
    const geo = context.geo;
    const location: GeoLocation = {
      country: geo?.country?.code || 'unknown',
      city: geo?.city || undefined,
      region: geo?.subdivision?.code || undefined,
      latitude: geo?.latitude ? parseFloat(geo.latitude) : undefined,
      longitude: geo?.longitude ? parseFloat(geo.longitude) : undefined,
    };

    // Determine the best API endpoint based on location
    let recommendedEndpoint = 'https://api.daorsflow.com'; // Default

    // Route to regional endpoints based on country
    switch (location.country) {
      case 'US':
      case 'CA':
        recommendedEndpoint = 'https://us-api.daorsflow.com';
        break;
      case 'GB':
      case 'DE':
      case 'FR':
      case 'IT':
      case 'ES':
      case 'NL':
      case 'CH':
        recommendedEndpoint = 'https://eu-api.daorsflow.com';
        break;
      case 'JP':
      case 'KR':
      case 'SG':
      case 'AU':
        recommendedEndpoint = 'https://asia-api.daorsflow.com';
        break;
      case 'BA': // Bosnia and Herzegovina
      case 'HR': // Croatia
      case 'RS': // Serbia
      case 'ME': // Montenegro
      case 'MK': // North Macedonia
      case 'SI': // Slovenia
        recommendedEndpoint = 'https://balkans-api.daorsflow.com';
        break;
      default:
        // Keep default endpoint
        break;
    }

    const processingTime = Date.now() - startTime;

    const response: GeoResponse = {
      location,
      recommendedEndpoint,
      timestamp: new Date().toISOString(),
      processingTime,
    };

    // If this is a routing request, proxy to the recommended endpoint
    if (request.method === 'POST' || request.url.includes('/route')) {
      try {
        const apiUrl = new URL(request.url);
        apiUrl.hostname = new URL(recommendedEndpoint).hostname;
        
        const proxyResponse = await fetch(apiUrl.toString(), {
          method: request.method,
          headers: {
            ...Object.fromEntries(request.headers.entries()),
            'X-Geo-Country': location.country,
            'X-Geo-City': location.city || '',
            'X-Geo-Region': location.region || '',
            'X-Processing-Time': processingTime.toString(),
          },
          body: request.method !== 'GET' ? await request.text() : undefined,
        });

        return new Response(proxyResponse.body, {
          status: proxyResponse.status,
          headers: {
            ...corsHeaders,
            ...Object.fromEntries(proxyResponse.headers.entries()),
            'X-Geo-Routed': 'true',
            'X-Geo-Endpoint': recommendedEndpoint,
          },
        });
      } catch (error) {
        console.error('Geo routing proxy error:', error);
        // Fall back to returning geo info
      }
    }

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Geo router error:', error);
    
    return new Response(JSON.stringify({
      error: 'Geo routing failed',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};