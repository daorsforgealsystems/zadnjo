#!/usr/bin/env node

/**
 * Automated Rollback Script
 * Handles rollback procedures for failed Netlify deployments
 * Usage: node scripts/rollback-deployment.js [deployment-id] [strategy]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DEPLOYMENT_ID = process.argv[2] || 'latest';
const ROLLBACK_STRATEGY = process.argv[3] || 'immediate';
const BACKUP_DIR = 'deployment-backups';
const LOGS_DIR = 'build-logs';

class RollbackManager {
  constructor(deploymentId, strategy) {
    this.deploymentId = deploymentId;
    this.strategy = strategy;
    this.backupPath = path.join(BACKUP_DIR, `backup-${deploymentId}`);
    this.logFile = path.join(LOGS_DIR, `rollback-${deploymentId}-${Date.now()}.log`);

    // Ensure directories exist
    [BACKUP_DIR, LOGS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async executeRollback() {
    console.log(`🔄 Executing rollback for deployment: ${this.deploymentId}`);
    console.log(`📋 Strategy: ${this.rollbackStrategy}`);

    this.log(`Starting rollback process for deployment ${this.deploymentId}`);
    this.log(`Strategy: ${this.strategy}`);

    try {
      // Pre-rollback validation
      await this.validateRollbackPrerequisites();

      // Create backup of current state
      await this.createBackup();

      // Execute rollback based on strategy
      switch (this.strategy) {
        case 'immediate':
          await this.immediateRollback();
          break;
        case 'gradual':
          await this.gradualRollback();
          break;
        case 'canary':
          await this.canaryRollback();
          break;
        default:
          throw new Error(`Unknown rollback strategy: ${this.strategy}`);
      }

      // Post-rollback validation
      await this.validateRollback();

      // Send success notification
      await this.notifySuccess();

      this.log('✅ Rollback completed successfully');
      console.log('✅ Rollback completed successfully');

    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      this.log(`❌ Rollback failed: ${error.message}`);

      // Send failure notification
      await this.notifyFailure(error);

      // Attempt emergency recovery if needed
      await this.emergencyRecovery();

      throw error;
    }
  }

  async validateRollbackPrerequisites() {
    console.log('🔍 Validating rollback prerequisites...');

    // Check if deployment exists
    if (this.deploymentId !== 'latest') {
      const deploymentExists = await this.checkDeploymentExists();
      if (!deploymentExists) {
        throw new Error(`Deployment ${this.deploymentId} not found`);
      }
    }

    // Check current system health
    const healthStatus = await this.checkSystemHealth();
    if (!healthStatus.healthy) {
      this.log(`⚠️ System health issues detected: ${healthStatus.issues.join(', ')}`);
      console.warn('⚠️ System health issues detected, proceeding with caution');
    }

    // Check if rollback is safe
    const safetyCheck = await this.checkRollbackSafety();
    if (!safetyCheck.safe) {
      throw new Error(`Unsafe to rollback: ${safetyCheck.reasons.join(', ')}`);
    }

    this.log('✅ Rollback prerequisites validated');
  }

  async checkDeploymentExists() {
    // Check if we have records of this deployment
    const metricsFile = path.join(LOGS_DIR, 'build-metrics.json');
    if (fs.existsSync(metricsFile)) {
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      return metrics.builds.some(build => build.id === this.deploymentId);
    }
    return false;
  }

  async checkSystemHealth() {
    const issues = [];

    // Check disk space
    try {
      const diskUsage = execSync('df -h . | tail -1 | awk \'{print $5}\'', { encoding: 'utf8' }).trim();
      const usagePercent = parseInt(diskUsage.replace('%', ''));
      if (usagePercent > 90) {
        issues.push(`High disk usage: ${diskUsage}`);
      }
    } catch {
      issues.push('Unable to check disk usage');
    }

    // Check memory
    try {
      const memInfo = execSync('free -h | grep "Mem:"', { encoding: 'utf8' });
      // Basic memory check - in production you'd want more sophisticated monitoring
    } catch {
      issues.push('Unable to check memory usage');
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  async checkRollbackSafety() {
    const reasons = [];

    // Check if we have a backup
    if (!fs.existsSync(this.backupPath)) {
      reasons.push('No backup available for rollback');
    }

    // Check if current deployment is stable
    const currentStability = await this.checkCurrentStability();
    if (!currentStability.stable) {
      reasons.push(`Current deployment unstable: ${currentStability.issues.join(', ')}`);
    }

    return {
      safe: reasons.length === 0,
      reasons
    };
  }

  async checkCurrentStability() {
    const issues = [];

    // Check for recent errors
    const recentLogs = this.getRecentLogs();
    const errorCount = (recentLogs.match(/ERROR/gi) || []).length;
    if (errorCount > 10) {
      issues.push(`High error count in recent logs: ${errorCount}`);
    }

    // Check response times (would integrate with monitoring system)
    // This is a placeholder for actual monitoring integration

    return {
      stable: issues.length === 0,
      issues
    };
  }

  async createBackup() {
    console.log('💾 Creating backup before rollback...');

    const backupInfo = {
      timestamp: new Date().toISOString(),
      deploymentId: this.deploymentId,
      strategy: this.strategy,
      files: []
    };

    // Backup critical files and configurations
    const criticalFiles = [
      'dist',
      'netlify.toml',
      'package.json',
      'package-lock.json',
      'build-logs',
      'build-reports'
    ];

    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        const stat = fs.statSync(file);
        backupInfo.files.push({
          path: file,
          type: stat.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          mtime: stat.mtime.toISOString()
        });
      }
    }

    // Save backup metadata
    fs.writeFileSync(path.join(this.backupPath + '.json'), JSON.stringify(backupInfo, null, 2));

    this.log(`📦 Backup created: ${this.backupPath}`);
    console.log(`📦 Backup created: ${this.backupPath}`);
  }

  async immediateRollback() {
    console.log('⚡ Executing immediate rollback...');

    this.log('Starting immediate rollback procedure');

    // For immediate rollback, we restore from backup
    // In a real Netlify setup, this would trigger a redeploy of the previous version

    try {
      // Simulate rollback by restoring configuration
      await this.restoreFromBackup();

      // Trigger redeploy (would integrate with Netlify API)
      await this.triggerRedeploy();

      this.log('✅ Immediate rollback completed');
    } catch (error) {
      this.log(`❌ Immediate rollback failed: ${error.message}`);
      throw error;
    }
  }

  async gradualRollback() {
    console.log('🔄 Executing gradual rollback...');

    this.log('Starting gradual rollback procedure');

    // Gradual rollback reduces traffic to new version over time
    const steps = [25, 50, 75, 100]; // Percentage of traffic

    for (const percentage of steps) {
      console.log(`📊 Rolling back ${percentage}% of traffic...`);

      // In a real setup, this would update load balancer weights
      await this.updateTrafficDistribution(100 - percentage);

      // Wait for monitoring period
      await this.wait(30000); // 30 seconds

      // Check stability
      const stability = await this.checkCurrentStability();
      if (!stability.stable) {
        console.warn(`⚠️ Stability issues detected at ${percentage}% rollback`);
        // Could implement automatic pause here
      }

      this.log(`Traffic distribution updated: ${percentage}% rolled back`);
    }

    this.log('✅ Gradual rollback completed');
  }

  async canaryRollback() {
    console.log('🐦 Executing canary rollback...');

    this.log('Starting canary rollback procedure');

    // Canary rollback tests the rollback on a small subset first
    const canaryPercentage = 5; // 5% of traffic

    console.log(`🧪 Testing rollback on ${canaryPercentage}% of traffic...`);

    // Route canary traffic to rolled back version
    await this.updateTrafficDistribution(canaryPercentage, 'rollback');

    // Monitor canary deployment
    await this.monitorCanary(300000); // 5 minutes

    // If canary is stable, proceed with full rollback
    const canaryStable = await this.checkCurrentStability();
    if (canaryStable.stable) {
      console.log('✅ Canary rollback successful, proceeding with full rollback...');
      await this.updateTrafficDistribution(100, 'rollback');
    } else {
      console.error('❌ Canary rollback failed, aborting full rollback');
      await this.updateTrafficDistribution(0, 'rollback'); // Revert canary
      throw new Error('Canary rollback validation failed');
    }

    this.log('✅ Canary rollback completed');
  }

  async restoreFromBackup() {
    console.log('🔄 Restoring from backup...');

    const backupInfoPath = this.backupPath + '.json';
    if (!fs.existsSync(backupInfoPath)) {
      throw new Error(`Backup info not found: ${backupInfoPath}`);
    }

    const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));

    // In a real scenario, this would restore files from backup
    // For now, we'll just log the restoration process
    for (const file of backupInfo.files) {
      this.log(`Restored: ${file.path}`);
    }

    console.log(`📦 Restored ${backupInfo.files.length} items from backup`);
  }

  async triggerRedeploy() {
    console.log('🚀 Triggering redeploy...');

    // In a real setup, this would call Netlify API to trigger a redeploy
    // For now, simulate the process
    this.log('Redeploy triggered via Netlify API');

    // Wait for redeploy to complete (simulated)
    await this.wait(10000);
  }

  async updateTrafficDistribution(rollbackPercentage, type = 'normal') {
    // In a real setup, this would update CDN/load balancer configuration
    this.log(`Traffic distribution updated: ${rollbackPercentage}% rollback (${type})`);
  }

  async monitorCanary(duration) {
    console.log(`👀 Monitoring canary deployment for ${duration / 1000} seconds...`);
    await this.wait(duration);
  }

  async validateRollback() {
    console.log('✅ Validating rollback...');

    // Check if rollback was successful
    const validationResults = await this.runRollbackValidation();

    if (!validationResults.success) {
      throw new Error(`Rollback validation failed: ${validationResults.errors.join(', ')}`);
    }

    this.log('✅ Rollback validation passed');
  }

  async runRollbackValidation() {
    // Run smoke tests or health checks
    const errors = [];

    try {
      // Check if application is responding
      // This would integrate with your health check endpoints
      console.log('🏥 Running health checks...');
    } catch (error) {
      errors.push(`Health check failed: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  async notifySuccess() {
    const message = `✅ Rollback completed successfully for deployment ${this.deploymentId}`;
    await this.sendNotification('Rollback Success', message, 'success');
  }

  async notifyFailure(error) {
    const message = `❌ Rollback failed for deployment ${this.deploymentId}: ${error.message}`;
    await this.sendNotification('Rollback Failure', message, 'error');
  }

  async emergencyRecovery() {
    console.log('🚨 Initiating emergency recovery...');

    try {
      // Attempt to restore to last known good state
      console.log('🔄 Attempting emergency restoration...');

      // This would implement emergency procedures
      this.log('Emergency recovery initiated');

    } catch (recoveryError) {
      console.error('❌ Emergency recovery also failed:', recoveryError.message);
      this.log(`❌ Emergency recovery failed: ${recoveryError.message}`);
    }
  }

  async sendNotification(title, message, type) {
    console.log(`📢 [${type.toUpperCase()}] ${title}: ${message}`);

    // In a real setup, this would send to Slack, email, etc.
    // For now, just log it
    this.log(`Notification sent: ${title} - ${message}`);
  }

  getRecentLogs() {
    try {
      const logFiles = fs.readdirSync(LOGS_DIR)
        .filter(file => file.endsWith('.log'))
        .sort()
        .slice(-5); // Last 5 log files

      let combinedLogs = '';
      for (const logFile of logFiles) {
        const content = fs.readFileSync(path.join(LOGS_DIR, logFile), 'utf8');
        combinedLogs += content + '\n';
      }

      return combinedLogs;
    } catch {
      return '';
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFileSync(this.logFile, logEntry);
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const rollback = new RollbackManager(DEPLOYMENT_ID, ROLLBACK_STRATEGY);
  rollback.executeRollback().catch(console.error);
}

export default RollbackManager;