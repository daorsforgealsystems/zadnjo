import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface MonitoringData {
  timestamp: string;
  frontend: {
    status: string;
    buildId: string;
    deployId: string;
    environment: string;
  };
  backend: {
    status: string;
    services: Record<string, any>;
    responseTime: number;
  };
  functions: {
    healthCheck: { status: string; lastRun?: string };
    cacheWarmer: { status: string; lastRun?: string };
    analytics: { status: string; lastRun?: string };
  };
  performance: {
    cacheHitRate: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'text/html',
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
    let backendData: any = { status: 'unknown', services: {}, responseTime: 0 };

    // Fetch backend health data
    const backendStartTime = Date.now();
    try {
      const response = await fetch(`${apiBaseUrl}/readyz`, {
        method: 'GET',
        headers: { 'User-Agent': 'Netlify-Monitoring-Dashboard' },
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        backendData = await response.json();
        backendData.responseTime = Date.now() - backendStartTime;
      }
    } catch (error) {
      console.warn('Backend monitoring fetch failed:', error);
      backendData = { 
        status: 'unreachable', 
        services: {}, 
        responseTime: Date.now() - backendStartTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    const monitoringData: MonitoringData = {
      timestamp: new Date().toISOString(),
      frontend: {
        status: 'healthy',
        buildId: process.env.BUILD_ID || 'unknown',
        deployId: process.env.DEPLOY_ID || 'unknown',
        environment: process.env.CONTEXT || 'production',
      },
      backend: backendData,
      functions: {
        healthCheck: { status: 'active' },
        cacheWarmer: { status: 'active' },
        analytics: { status: 'active' },
      },
      performance: {
        cacheHitRate: 85, // Mock data - in production, get from analytics
        averageResponseTime: backendData.responseTime || 0,
        errorRate: 0.1, // Mock data - in production, calculate from logs
      },
    };

    const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flow Motion - Monitoring Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { 
            text-align: center; 
            color: white; 
            margin-bottom: 30px;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .card { 
            background: white; 
            border-radius: 12px; 
            padding: 24px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .card h3 { 
            color: #333; 
            margin-bottom: 16px; 
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status { 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.85rem; 
            font-weight: 600;
            text-transform: uppercase;
        }
        .status.healthy { background: #d4edda; color: #155724; }
        .status.degraded { background: #fff3cd; color: #856404; }
        .status.error { background: #f8d7da; color: #721c24; }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            margin: 12px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #666; }
        .metric-value { font-weight: 600; color: #333; }
        .services { margin-top: 16px; }
        .service { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 8px 12px; 
            margin: 4px 0;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .timestamp { 
            text-align: center; 
            color: white; 
            margin-top: 30px; 
            opacity: 0.8;
        }
        .refresh-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 20px;
        }
        .refresh-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .loading { animation: pulse 2s infinite; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚛 Flow Motion</h1>
            <p>Logistics Platform Monitoring Dashboard</p>
            <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🌐 Frontend Status</h3>
                <div class="metric">
                    <span class="metric-label">Status</span>
                    <span class="status ${monitoringData.frontend.status}">${monitoringData.frontend.status}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Environment</span>
                    <span class="metric-value">${monitoringData.frontend.environment}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Build ID</span>
                    <span class="metric-value">${monitoringData.frontend.buildId}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Deploy ID</span>
                    <span class="metric-value">${monitoringData.frontend.deployId}</span>
                </div>
            </div>

            <div class="card">
                <h3>⚙️ Backend Status</h3>
                <div class="metric">
                    <span class="metric-label">Status</span>
                    <span class="status ${monitoringData.backend.status === 'ready' ? 'healthy' : 'error'}">${monitoringData.backend.status}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value">${monitoringData.backend.responseTime}ms</span>
                </div>
                <div class="services">
                    <h4>Services:</h4>
                    ${Object.entries(monitoringData.backend.services || {}).map(([name, service]: [string, any]) => `
                        <div class="service">
                            <span>${name}</span>
                            <span class="status ${service.healthy ? 'healthy' : 'error'}">${service.status || 'unknown'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h3>⚡ Netlify Functions</h3>
                ${Object.entries(monitoringData.functions).map(([name, func]) => `
                    <div class="metric">
                        <span class="metric-label">${name}</span>
                        <span class="status healthy">${func.status}</span>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <h3>📊 Performance Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Cache Hit Rate</span>
                    <span class="metric-value">${monitoringData.performance.cacheHitRate}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Avg Response Time</span>
                    <span class="metric-value">${monitoringData.performance.averageResponseTime}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value">${monitoringData.performance.errorRate}%</span>
                </div>
            </div>
        </div>

        <div class="timestamp">
            Last updated: ${new Date(monitoringData.timestamp).toLocaleString()}
            <br>
            <small>Auto-refresh every 30 seconds</small>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);

        // Add loading state during refresh
        document.addEventListener('beforeunload', () => {
            document.body.classList.add('loading');
        });
    </script>
</body>
</html>
    `;

    return {
      statusCode: 200,
      headers,
      body: dashboardHtml,
    };
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Monitoring dashboard failed',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};