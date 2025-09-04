#!/usr/bin/env node

/**
 * Post-Deployment Monitoring Script
 * Continuously monitors deployed application for issues and performance
 * Usage: node scripts/post-deployment-monitor.js [environment] [duration]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ENVIRONMENT = process.argv[2] || 'production';
const MONITOR_DURATION = parseInt(process.argv[3]) || 3600000; // 1 hour default
const MONITOR_INTERVAL = 30000; // 30 seconds
const HEALTH_CHECK_URL = ENVIRONMENT === 'production'
  ? 'https://your-site.netlify.app'
  : 'https://develop--your-site.netlify.app';

const MONITORING_DIR = 'post-deployment-monitoring';
const LOG_FILE = path.join(MONITORING_DIR, `monitoring-${ENVIRONMENT}-${Date.now()}.log`);
const METRICS_FILE = path.join(MONITORING_DIR, `metrics-${ENVIRONMENT}-${Date.now()}.json`);

class PostDeploymentMonitor {
  constructor(environment, duration) {
    this.environment = environment;
    this.duration = duration;
    this.startTime = Date.now();
    this.endTime = this.startTime + duration;
    this.metrics = {
      timestamp: new Date().toISOString(),
      environment,
      duration,
      checks: [],
      alerts: [],
      summary: {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        uptimePercentage: 100,
        errorRate: 0
      }
    };

    // Ensure monitoring directory exists
    if (!fs.existsSync(MONITORING_DIR)) {
      fs.mkdirSync(MONITORING_DIR, { recursive: true });
    }

    this.log(`🚀 Starting post-deployment monitoring for ${environment}`);
    this.log(`📊 Monitoring duration: ${Math.round(duration / 60000)} minutes`);
    this.log(`🔗 Health check URL: ${HEALTH_CHECK_URL}`);
  }

  async startMonitoring() {
    const monitoringPromise = this.runMonitoringLoop();
    const timeoutPromise = this.createTimeoutPromise();

    try {
      await Promise.race([monitoringPromise, timeoutPromise]);
    } catch (error) {
      this.log(`❌ Monitoring error: ${error.message}`);
    } finally {
      await this.generateReport();
      this.log('✅ Monitoring completed');
    }
  }

  async runMonitoringLoop() {
    while (Date.now() < this.endTime) {
      await this.performHealthCheck();
      await this.performPerformanceCheck();
      await this.performSecurityCheck();

      // Wait for next interval
      await this.wait(MONITOR_INTERVAL);
    }
  }

  async performHealthCheck() {
    const check = {
      type: 'health',
      timestamp: new Date().toISOString(),
      url: HEALTH_CHECK_URL
    };

    try {
      const startTime = Date.now();

      // Basic health check
      const response = await this.makeRequest(HEALTH_CHECK_URL);
      const responseTime = Date.now() - startTime;

      check.status = 'success';
      check.responseTime = responseTime;
      check.statusCode = response.status;
      check.responseSize = response.headers.get('content-length') || 'unknown';

      // Check for critical issues
      if (response.status >= 500) {
        this.addAlert('Server Error', `HTTP ${response.status} from ${HEALTH_CHECK_URL}`, 'critical');
      } else if (response.status >= 400) {
        this.addAlert('Client Error', `HTTP ${response.status} from ${HEALTH_CHECK_URL}`, 'warning');
      }

      if (responseTime > 5000) { // 5 second threshold
        this.addAlert('Slow Response', `Response time: ${responseTime}ms`, 'warning');
      }

    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      this.addAlert('Health Check Failed', error.message, 'critical');
    }

    this.metrics.checks.push(check);
    this.updateSummary(check);
  }

  async performPerformanceCheck() {
    const check = {
      type: 'performance',
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    try {
      // Check Core Web Vitals approximation
      const response = await this.makeRequest(`${HEALTH_CHECK_URL}/static/js/main.js`);
      check.metrics.jsLoadTime = Date.now() - Date.parse(check.timestamp);

      // Check CSS loading
      const cssResponse = await this.makeRequest(`${HEALTH_CHECK_URL}/static/css/main.css`);
      check.metrics.cssLoadTime = Date.now() - Date.parse(check.timestamp);

      // Check image loading (if any)
      check.metrics.totalLoadTime = Math.max(
        check.metrics.jsLoadTime || 0,
        check.metrics.cssLoadTime || 0
      );

      check.status = 'success';

      // Performance alerts
      if (check.metrics.totalLoadTime > 3000) { // 3 second threshold
        this.addAlert('Slow Asset Loading', `Total load time: ${check.metrics.totalLoadTime}ms`, 'warning');
      }

    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }

    this.metrics.checks.push(check);
  }

  async performSecurityCheck() {
    const check = {
      type: 'security',
      timestamp: new Date().toISOString(),
      issues: []
    };

    try {
      const response = await this.makeRequest(HEALTH_CHECK_URL);

      // Check security headers
      const headers = response.headers;

      const securityHeaders = {
        'strict-transport-security': 'HSTS not configured',
        'x-frame-options': 'X-Frame-Options not set',
        'x-content-type-options': 'X-Content-Type-Options not set',
        'content-security-policy': 'CSP not configured'
      };

      for (const [header, message] of Object.entries(securityHeaders)) {
        if (!headers.get(header)) {
          check.issues.push(message);
        }
      }

      // Check for HTTPS
      if (!HEALTH_CHECK_URL.startsWith('https://')) {
        check.issues.push('Not using HTTPS');
      }

      check.status = check.issues.length === 0 ? 'success' : 'warning';

      if (check.issues.length > 0) {
        this.addAlert('Security Issues', check.issues.join('; '), 'warning');
      }

    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
    }

    this.metrics.checks.push(check);
  }

  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Post-Deployment-Monitor/1.0',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  addAlert(title, message, severity) {
    const alert = {
      timestamp: new Date().toISOString(),
      title,
      message,
      severity,
      acknowledged: false
    };

    this.metrics.alerts.push(alert);
    this.log(`🚨 [${severity.toUpperCase()}] ${title}: ${message}`);

    // Send external notification (would integrate with Slack/webhook)
    this.sendExternalNotification(alert);
  }

  async sendExternalNotification(alert) {
    // Placeholder for external notification integration
    // In production, this would send to Slack, email, PagerDuty, etc.

    const webhookUrl = process.env.MONITORING_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await this.makeRequest(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 ${alert.title}\n${alert.message}\nSeverity: ${alert.severity}`,
            attachments: [{
              color: alert.severity === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Environment', value: this.environment, short: true },
                { title: 'Time', value: alert.timestamp, short: true }
              ]
            }]
          })
        });
      } catch (error) {
        this.log(`Failed to send external notification: ${error.message}`);
      }
    }
  }

  updateSummary(check) {
    this.metrics.summary.totalChecks++;

    if (check.status === 'success') {
      this.metrics.summary.successfulChecks++;
    } else {
      this.metrics.summary.failedChecks++;
    }

    // Update uptime percentage
    this.metrics.summary.uptimePercentage =
      (this.metrics.summary.successfulChecks / this.metrics.summary.totalChecks) * 100;

    // Update error rate
    this.metrics.summary.errorRate =
      (this.metrics.summary.failedChecks / this.metrics.summary.totalChecks) * 100;

    // Update average response time for health checks
    if (check.type === 'health' && check.responseTime) {
      const healthChecks = this.metrics.checks.filter(c => c.type === 'health' && c.responseTime);
      this.metrics.summary.averageResponseTime =
        healthChecks.reduce((sum, c) => sum + c.responseTime, 0) / healthChecks.length;
    }
  }

  async generateReport() {
    // Calculate final summary
    this.metrics.summary.duration = Date.now() - this.startTime;
    this.metrics.summary.endTime = new Date().toISOString();

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(MONITORING_DIR, `monitoring-report-${this.environment}-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlReport);

    // Save JSON metrics
    fs.writeFileSync(METRICS_FILE, JSON.stringify(this.metrics, null, 2));

    // Save summary for quick access
    const summaryPath = path.join(MONITORING_DIR, 'latest-monitoring-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: this.metrics.timestamp,
      environment: this.environment,
      summary: this.metrics.summary,
      latestAlerts: this.metrics.alerts.slice(-5)
    }, null, 2));

    this.log(`📊 Monitoring report saved: ${htmlPath}`);
    this.log(`📄 Metrics saved: ${METRICS_FILE}`);

    // Print summary
    console.log('\n📈 Monitoring Summary:');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.environment}`);
    console.log(`Duration: ${Math.round(this.metrics.summary.duration / 60000)} minutes`);
    console.log(`Total Checks: ${this.metrics.summary.totalChecks}`);
    console.log(`Successful: ${this.metrics.summary.successfulChecks}`);
    console.log(`Failed: ${this.metrics.summary.failedChecks}`);
    console.log(`Uptime: ${this.metrics.summary.uptimePercentage.toFixed(2)}%`);
    console.log(`Avg Response Time: ${Math.round(this.metrics.summary.averageResponseTime)}ms`);
    console.log(`Error Rate: ${this.metrics.summary.errorRate.toFixed(2)}%`);
    console.log(`Alerts: ${this.metrics.alerts.length}`);
    console.log('='.repeat(50));

    if (this.metrics.alerts.length > 0) {
      console.log('\n🚨 Recent Alerts:');
      this.metrics.alerts.slice(-5).forEach(alert => {
        console.log(`  ${alert.timestamp}: ${alert.title} (${alert.severity})`);
      });
    }
  }

  generateHTMLReport() {
    const summary = this.metrics.summary;
    const recentChecks = this.metrics.checks.slice(-20);
    const recentAlerts = this.metrics.alerts.slice(-10);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Post-Deployment Monitoring Report - ${this.environment}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-card.success { border-left: 4px solid #28a745; }
        .metric-card.warning { border-left: 4px solid #ffc107; }
        .metric-card.error { border-left: 4px solid #dc3545; }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .alerts-section { margin-bottom: 30px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 10px; }
        .alert.critical { background: #f8d7da; border-color: #f5c6cb; }
        .checks-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .status-success { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Post-Deployment Monitoring Report</h1>
            <p>Environment: ${this.environment} | Generated: ${new Date().toLocaleString()}</p>
            <p>Monitoring Duration: ${Math.round(summary.duration / 60000)} minutes</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card success">
                <div class="metric-title">Uptime</div>
                <div class="metric-value">${summary.uptimePercentage.toFixed(2)}%</div>
            </div>
            <div class="metric-card ${summary.errorRate > 5 ? 'error' : 'success'}">
                <div class="metric-title">Error Rate</div>
                <div class="metric-value">${summary.errorRate.toFixed(2)}%</div>
            </div>
            <div class="metric-card success">
                <div class="metric-title">Avg Response Time</div>
                <div class="metric-value">${Math.round(summary.averageResponseTime)}ms</div>
            </div>
            <div class="metric-card ${summary.failedChecks > 0 ? 'warning' : 'success'}">
                <div class="metric-title">Total Checks</div>
                <div class="metric-value">${summary.successfulChecks}/${summary.totalChecks}</div>
            </div>
        </div>

        ${recentAlerts.length > 0 ? `
        <div class="alerts-section">
            <h3>🚨 Recent Alerts (${recentAlerts.length})</h3>
            ${recentAlerts.map(alert => `
            <div class="alert ${alert.severity}">
                <strong>${alert.title}</strong> (${alert.severity})
                <br><small>${alert.timestamp}</small>
                <p>${alert.message}</p>
            </div>
            `).join('')}
        </div>
        ` : '<div class="alerts-section"><h3>✅ No Alerts</h3></div>'}

        <h3>🔍 Recent Health Checks</h3>
        <table class="checks-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${recentChecks.map(check => `
                <tr>
                    <td>${new Date(check.timestamp).toLocaleTimeString()}</td>
                    <td>${check.type}</td>
                    <td class="status-${check.status}">${check.status.toUpperCase()}</td>
                    <td>${check.responseTime ? check.responseTime + 'ms' : '-'}</td>
                    <td>${check.error || check.statusCode || 'OK'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFileSync(LOG_FILE, logEntry);
    console.log(message);
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createTimeoutPromise() {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Monitoring timeout')), this.duration);
    });
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new PostDeploymentMonitor(ENVIRONMENT, MONITOR_DURATION);
  monitor.startMonitoring().catch(console.error);
}

export default PostDeploymentMonitor;