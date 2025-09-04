#!/usr/bin/env node

/**
 * Build Monitor Script
 * Monitors Netlify builds and sends alerts for issues
 * Usage: node scripts/monitor-build.js [site-id] [build-hook-url]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SITE_ID = process.argv[2] || 'ecde7505-1be4-4e1d-b477-3a48a2518e6a';
const BUILD_HOOK_URL = process.argv[3];
const LOGS_DIR = 'build-logs';
const METRICS_FILE = path.join(LOGS_DIR, 'build-metrics.json');

class BuildMonitor {
  constructor(siteId, buildHookUrl) {
    this.siteId = siteId;
    this.buildHookUrl = buildHookUrl;
    this.metrics = this.loadMetrics();

    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  }

  loadMetrics() {
    if (fs.existsSync(METRICS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
      } catch (error) {
        console.warn('Failed to load metrics file:', error.message);
      }
    }
    return {
      builds: [],
      lastSuccessfulBuild: null,
      consecutiveFailures: 0,
      averageBuildTime: 0,
      totalBuilds: 0
    };
  }

  saveMetrics() {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(this.metrics, null, 2));
  }

  async monitorBuild(buildData = {}) {
    console.log('🔍 Monitoring build status...');

    const timestamp = new Date().toISOString();
    const buildId = buildData.id || `build_${Date.now()}`;
    const buildStart = buildData.start || Date.now();

    try {
      // Check build status (this would integrate with Netlify API in production)
      const status = await this.checkBuildStatus(buildId);

      const buildEnd = Date.now();
      const duration = buildEnd - buildStart;

      const buildRecord = {
        id: buildId,
        timestamp,
        status,
        duration,
        durationMinutes: (duration / 60000).toFixed(2),
        siteId: this.siteId,
        commit: this.getCurrentCommit(),
        branch: this.getCurrentBranch()
      };

      // Update metrics
      this.updateMetrics(buildRecord);

      // Log build result
      this.logBuild(buildRecord);

      // Send alerts if needed
      await this.handleAlerts(buildRecord);

      // Analyze build for issues
      if (status === 'failed') {
        await this.analyzeBuildFailure(buildRecord);
      }

      this.saveMetrics();

      console.log(`✅ Build monitoring complete: ${status.toUpperCase()} (${buildRecord.durationMinutes}min)`);
      return buildRecord;

    } catch (error) {
      console.error('❌ Build monitoring failed:', error.message);
      await this.sendAlert('Build monitoring failed', error.message, 'error');
      throw error;
    }
  }

  async checkBuildStatus(buildId) {
    // In a real implementation, this would call the Netlify API
    // For now, we'll simulate based on build output or check exit codes

    try {
      // Check if dist directory exists and has content
      if (fs.existsSync('dist')) {
        const files = fs.readdirSync('dist');
        if (files.length > 0) {
          return 'success';
        }
      }

      // Check for recent build errors in logs
      const recentLog = this.getRecentBuildLog();
      if (recentLog && recentLog.includes('ERROR')) {
        return 'failed';
      }

      return 'success'; // Default to success if no clear failure indicators
    } catch (error) {
      console.warn('Failed to determine build status:', error.message);
      return 'unknown';
    }
  }

  getCurrentCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  updateMetrics(buildRecord) {
    this.metrics.builds.push(buildRecord);
    this.metrics.totalBuilds++;

    if (buildRecord.status === 'success') {
      this.metrics.lastSuccessfulBuild = buildRecord.timestamp;
      this.metrics.consecutiveFailures = 0;

      // Update average build time
      const successfulBuilds = this.metrics.builds.filter(b => b.status === 'success');
      this.metrics.averageBuildTime = successfulBuilds.reduce((sum, b) => sum + b.duration, 0) / successfulBuilds.length;
    } else if (buildRecord.status === 'failed') {
      this.metrics.consecutiveFailures++;
    }

    // Keep only last 100 builds
    if (this.metrics.builds.length > 100) {
      this.metrics.builds = this.metrics.builds.slice(-100);
    }
  }

  logBuild(buildRecord) {
    const logFile = path.join(LOGS_DIR, `build-${buildRecord.id}.log`);
    const logContent = `
Build Report: ${buildRecord.id}
Timestamp: ${buildRecord.timestamp}
Status: ${buildRecord.status.toUpperCase()}
Duration: ${buildRecord.durationMinutes} minutes
Commit: ${buildRecord.commit}
Branch: ${buildRecord.branch}
Site ID: ${buildRecord.siteId}

Metrics:
- Total Builds: ${this.metrics.totalBuilds}
- Consecutive Failures: ${this.metrics.consecutiveFailures}
- Average Build Time: ${(this.metrics.averageBuildTime / 60000).toFixed(2)} minutes
- Last Successful Build: ${this.metrics.lastSuccessfulBuild || 'Never'}
`;

    fs.writeFileSync(logFile, logContent);
    console.log(`📄 Build log saved: ${logFile}`);
  }

  async handleAlerts(buildRecord) {
    const alerts = [];

    // Alert on build failure
    if (buildRecord.status === 'failed') {
      alerts.push({
        type: 'error',
        title: 'Build Failed',
        message: `Build ${buildRecord.id} failed after ${buildRecord.durationMinutes} minutes`,
        priority: 'high'
      });
    }

    // Alert on multiple consecutive failures
    if (this.metrics.consecutiveFailures >= 3) {
      alerts.push({
        type: 'error',
        title: 'Multiple Build Failures',
        message: `${this.metrics.consecutiveFailures} consecutive builds have failed`,
        priority: 'critical'
      });
    }

    // Alert on unusually long build time
    if (buildRecord.duration > this.metrics.averageBuildTime * 2 && this.metrics.averageBuildTime > 0) {
      alerts.push({
        type: 'warning',
        title: 'Slow Build Detected',
        message: `Build took ${buildRecord.durationMinutes} minutes (${(buildRecord.duration / this.metrics.averageBuildTime).toFixed(1)}x normal)`,
        priority: 'medium'
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert.title, alert.message, alert.type, alert.priority);
    }
  }

  async analyzeBuildFailure(buildRecord) {
    console.log('🔍 Analyzing build failure...');

    const analysis = {
      timestamp: new Date().toISOString(),
      buildId: buildRecord.id,
      issues: [],
      recommendations: []
    };

    try {
      // Check for common failure patterns
      const recentLog = this.getRecentBuildLog();

      if (recentLog) {
        // Check for npm install failures
        if (recentLog.includes('npm ERR') || recentLog.includes('ENOTFOUND')) {
          analysis.issues.push('Package installation failed - check npm registry connectivity');
          analysis.recommendations.push('Verify npm credentials and network connectivity');
        }

        // Check for build tool failures
        if (recentLog.includes('vite build') && recentLog.includes('ERROR')) {
          analysis.issues.push('Vite build failed - check for TypeScript or import errors');
          analysis.recommendations.push('Run npm run type-check and fix any TypeScript errors');
        }

        // Check for missing dependencies
        if (recentLog.includes('Cannot find module') || recentLog.includes('Module not found')) {
          analysis.issues.push('Missing dependencies - check package.json and node_modules');
          analysis.recommendations.push('Run npm install and verify all dependencies are installed');
        }

        // Check for memory issues
        if (recentLog.includes('out of memory') || recentLog.includes('heap')) {
          analysis.issues.push('Build ran out of memory - increase Node.js memory limit');
          analysis.recommendations.push('Increase NODE_OPTIONS="--max-old-space-size=4096" or upgrade build instance');
        }
      }

      // Save analysis
      const analysisFile = path.join(LOGS_DIR, `failure-analysis-${buildRecord.id}.json`);
      fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

      console.log(`📊 Failure analysis saved: ${analysisFile}`);

      // Send analysis alert
      if (analysis.issues.length > 0) {
        await this.sendAlert(
          'Build Failure Analysis',
          `Found ${analysis.issues.length} potential issues. Check ${analysisFile} for details.`,
          'warning'
        );
      }

    } catch (error) {
      console.warn('Failed to analyze build failure:', error.message);
    }
  }

  getRecentBuildLog() {
    try {
      // Try to read from various log locations
      const possibleLogs = [
        'npm-debug.log',
        'yarn-error.log',
        '.npm/_logs/*.log',
        'build-logs/*.log'
      ];

      for (const logPattern of possibleLogs) {
        const files = execSync(`find . -name "${logPattern}" -type f -mmin -60 2>/dev/null || true`, { encoding: 'utf8' });
        if (files.trim()) {
          const latestLog = files.trim().split('\n')[0];
          if (fs.existsSync(latestLog)) {
            return fs.readFileSync(latestLog, 'utf8');
          }
        }
      }
    } catch {
      // Ignore errors in log detection
    }
    return null;
  }

  async sendAlert(title, message, type = 'info', priority = 'low') {
    console.log(`📢 [${type.toUpperCase()}] ${title}: ${message}`);

    if (this.buildHookUrl) {
      try {
        const alertData = {
          title,
          message,
          type,
          priority,
          timestamp: new Date().toISOString(),
          siteId: this.siteId,
          metrics: {
            consecutiveFailures: this.metrics.consecutiveFailures,
            totalBuilds: this.metrics.totalBuilds,
            averageBuildTime: this.metrics.averageBuildTime
          }
        };

        // In a real implementation, send to webhook
        console.log(`🌐 Would send alert to: ${this.buildHookUrl}`);
        console.log(`📋 Alert data:`, JSON.stringify(alertData, null, 2));

      } catch (error) {
        console.warn('Failed to send alert:', error.message);
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBuilds: this.metrics.totalBuilds,
        successfulBuilds: this.metrics.builds.filter(b => b.status === 'success').length,
        failedBuilds: this.metrics.builds.filter(b => b.status === 'failed').length,
        averageBuildTime: (this.metrics.averageBuildTime / 60000).toFixed(2),
        consecutiveFailures: this.metrics.consecutiveFailures,
        lastSuccessfulBuild: this.metrics.lastSuccessfulBuild
      },
      recentBuilds: this.metrics.builds.slice(-10),
      alerts: []
    };

    const reportFile = path.join(LOGS_DIR, `build-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📊 Build report generated: ${reportFile}`);
    return report;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new BuildMonitor(SITE_ID, BUILD_HOOK_URL);

  if (process.argv[2] === 'report') {
    monitor.generateReport();
  } else {
    monitor.monitorBuild().catch(console.error);
  }
}

export default BuildMonitor;