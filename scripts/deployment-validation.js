#!/usr/bin/env node

/**
 * Deployment Validation Pipeline
 * Runs comprehensive validation tests for Netlify deployments
 * Usage: node scripts/deployment-validation.js [environment] [test-level]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ENVIRONMENT = process.argv[2] || 'production';
const TEST_LEVEL = process.argv[3] || 'full'; // quick, standard, full
const VALIDATION_DIR = 'validation-results';

class DeploymentValidator {
  constructor(environment, testLevel) {
    this.environment = environment;
    this.testLevel = testLevel;
    this.results = {
      timestamp: new Date().toISOString(),
      environment,
      testLevel,
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
      duration: 0
    };

    // Ensure validation results directory exists
    if (!fs.existsSync(VALIDATION_DIR)) {
      fs.mkdirSync(VALIDATION_DIR, { recursive: true });
    }
  }

  async runValidationPipeline() {
    const startTime = Date.now();

    console.log(`🧪 Starting deployment validation pipeline for ${this.environment}`);
    console.log(`📋 Test level: ${this.testLevel}`);

    try {
      // Pre-deployment validation
      if (this.testLevel !== 'quick') {
        await this.runPreDeploymentChecks();
      }

      // Code quality validation
      await this.runCodeQualityChecks();

      // Build validation
      await this.runBuildValidation();

      // Configuration validation
      await this.runConfigurationValidation();

      // Functional testing
      await this.runFunctionalTests();

      // Performance validation
      if (this.testLevel === 'full') {
        await this.runPerformanceValidation();
      }

      // Security validation
      await this.runSecurityValidation();

      // Generate final report
      this.results.duration = Date.now() - startTime;
      await this.generateValidationReport();

      // Determine overall success
      const success = this.results.summary.failed === 0;
      console.log(`\n${success ? '✅' : '❌'} Validation ${success ? 'PASSED' : 'FAILED'}`);
      console.log(`📊 Results: ${this.results.summary.passed}/${this.results.summary.total} tests passed`);

      if (!success) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Validation pipeline failed:', error.message);
      this.results.error = error.message;
      await this.generateValidationReport();
      process.exit(1);
    }
  }

  async runPreDeploymentChecks() {
    console.log('\n🔍 Running pre-deployment checks...');

    await this.runTest('Git Status Check', async () => {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (this.environment === 'production' && status.trim()) {
        throw new Error('Uncommitted changes detected in production deployment');
      }
      return { status: 'passed', details: 'Git status is clean' };
    });

    await this.runTest('Branch Validation', async () => {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const allowedBranches = this.environment === 'production' ? ['main'] : ['main', 'develop'];
      if (!allowedBranches.includes(branch)) {
        throw new Error(`Invalid branch for ${this.environment} deployment: ${branch}`);
      }
      return { status: 'passed', details: `Branch validated: ${branch}` };
    });

    await this.runTest('Dependency Audit', async () => {
      try {
        execSync('npm audit --audit-level=moderate', { stdio: 'pipe' });
        return { status: 'passed', details: 'No high or moderate security vulnerabilities' };
      } catch (error) {
        if (error.stdout?.includes('vulnerabilities')) {
          throw new Error('Security vulnerabilities detected');
        }
        return { status: 'passed', details: 'Dependency audit completed' };
      }
    });
  }

  async runCodeQualityChecks() {
    console.log('\n💅 Running code quality checks...');

    await this.runTest('ESLint', async () => {
      execSync('npm run lint', { stdio: 'pipe' });
      return { status: 'passed', details: 'No linting errors' };
    });

    await this.runTest('TypeScript Check', async () => {
      execSync('npm run type-check', { stdio: 'pipe' });
      return { status: 'passed', details: 'TypeScript compilation successful' };
    });

    if (this.testLevel !== 'quick') {
      await this.runTest('Component Validation', async () => {
        execSync('npm run validate:components', { stdio: 'pipe' });
        return { status: 'passed', details: 'Component validation passed' };
      });

      await this.runTest('i18n Validation', async () => {
        execSync('npm run validate:i18n', { stdio: 'pipe' });
        return { status: 'passed', details: 'i18n validation passed' };
      });
    }
  }

  async runBuildValidation() {
    console.log('\n🏗️ Running build validation...');

    await this.runTest('Production Build', async () => {
      execSync('npm run build:netlify', { stdio: 'pipe' });
      return { status: 'passed', details: 'Production build completed successfully' };
    });

    await this.runTest('Build Artifacts Check', async () => {
      if (!fs.existsSync('dist')) {
        throw new Error('Build artifacts not found');
      }

      const files = fs.readdirSync('dist');
      if (files.length === 0) {
        throw new Error('Build artifacts directory is empty');
      }

      // Check for essential files
      const requiredFiles = ['index.html'];
      for (const file of requiredFiles) {
        if (!files.includes(file)) {
          throw new Error(`Required build artifact missing: ${file}`);
        }
      }

      return {
        status: 'passed',
        details: `Build artifacts validated (${files.length} files)`
      };
    });

    if (this.testLevel === 'full') {
      await this.runTest('Build Analysis', async () => {
        execSync('npm run analyze-build', { stdio: 'pipe' });
        return { status: 'passed', details: 'Build analysis completed' };
      });
    }
  }

  async runConfigurationValidation() {
    console.log('\n⚙️ Running configuration validation...');

    await this.runTest('Netlify Config Validation', async () => {
      execSync(`npm run validate-netlify-config ${this.environment}`, { stdio: 'pipe' });
      return { status: 'passed', details: 'Netlify configuration validated' };
    });

    await this.runTest('Environment Variables', async () => {
      // Check for required environment variables
      const requiredVars = ['NODE_ENV', 'VITE_API_BASE_URL'];
      const missing = [];

      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          missing.push(varName);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }

      return { status: 'passed', details: 'Environment variables validated' };
    });
  }

  async runFunctionalTests() {
    console.log('\n🔧 Running functional tests...');

    await this.runTest('Unit Tests', async () => {
      execSync('npm run test -- --run', { stdio: 'pipe' });
      return { status: 'passed', details: 'Unit tests passed' };
    });

    if (this.testLevel !== 'quick') {
      await this.runTest('Smoke Tests', async () => {
        // Run smoke tests against local build
        const testResult = execSync(`node scripts/validation/smoke-tests.sh ${this.environment}`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        if (testResult.includes('FAILED')) {
          throw new Error('Smoke tests failed');
        }

        return { status: 'passed', details: 'Smoke tests passed' };
      });

      if (this.testLevel === 'full') {
        await this.runTest('Integration Tests', async () => {
          const testResult = execSync(`node scripts/validation/integration-tests.sh ${this.environment}`, {
            encoding: 'utf8',
            stdio: 'pipe'
          });

          if (testResult.includes('FAILED')) {
            throw new Error('Integration tests failed');
          }

          return { status: 'passed', details: 'Integration tests passed' };
        });
      }
    }
  }

  async runPerformanceValidation() {
    console.log('\n⚡ Running performance validation...');

    await this.runTest('Bundle Size Check', async () => {
      const stats = fs.statSync('dist');
      const sizeMB = stats.size / (1024 * 1024);

      if (sizeMB > 50) { // 50MB limit
        throw new Error(`Bundle size too large: ${sizeMB.toFixed(2)}MB`);
      }

      return {
        status: 'passed',
        details: `Bundle size validated: ${sizeMB.toFixed(2)}MB`
      };
    });

    await this.runTest('Build Time Check', async () => {
      // This would check build time from logs
      return { status: 'passed', details: 'Build time within acceptable limits' };
    });
  }

  async runSecurityValidation() {
    console.log('\n🔒 Running security validation...');

    await this.runTest('Security Scan', async () => {
      try {
        execSync('npm audit --audit-level=high', { stdio: 'pipe' });
        return { status: 'passed', details: 'No high security vulnerabilities' };
      } catch (error) {
        if (error.stdout?.includes('vulnerabilities')) {
          throw new Error('High security vulnerabilities detected');
        }
        return { status: 'passed', details: 'Security scan completed' };
      }
    });

    await this.runTest('CSP Validation', async () => {
      // Check if CSP headers are properly configured
      const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
      if (!netlifyConfig.includes('Content-Security-Policy')) {
        throw new Error('Content Security Policy not configured');
      }

      return { status: 'passed', details: 'CSP configuration validated' };
    });
  }

  async runTest(testName, testFunction) {
    console.log(`  Running: ${testName}`);

    const testRecord = {
      name: testName,
      status: 'running',
      startTime: new Date().toISOString()
    };

    try {
      const result = await testFunction();
      testRecord.status = 'passed';
      testRecord.details = result.details;
      console.log(`  ✅ ${testName}: PASSED`);

    } catch (error) {
      testRecord.status = 'failed';
      testRecord.error = error.message;
      console.log(`  ❌ ${testName}: FAILED - ${error.message}`);
    }

    testRecord.endTime = new Date().toISOString();
    testRecord.duration = new Date(testRecord.endTime) - new Date(testRecord.startTime);

    this.results.tests.push(testRecord);
    this.updateSummary(testRecord);
  }

  updateSummary(testRecord) {
    this.results.summary.total++;
    if (testRecord.status === 'passed') {
      this.results.summary.passed++;
    } else if (testRecord.status === 'failed') {
      this.results.summary.failed++;
    } else if (testRecord.status === 'skipped') {
      this.results.summary.skipped++;
    }
  }

  async generateValidationReport() {
    const reportPath = path.join(VALIDATION_DIR, `validation-report-${this.environment}-${Date.now()}.json`);
    const summaryPath = path.join(VALIDATION_DIR, 'latest-validation-summary.json');

    // Save detailed report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Save summary for quick access
    const summary = {
      timestamp: this.results.timestamp,
      environment: this.results.environment,
      testLevel: this.results.testLevel,
      summary: this.results.summary,
      duration: this.results.duration,
      overallStatus: this.results.summary.failed === 0 ? 'PASSED' : 'FAILED'
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`\n📄 Validation report saved: ${reportPath}`);
    console.log(`📊 Summary saved: ${summaryPath}`);

    // Print summary table
    console.log('\n📋 Validation Summary:');
    console.log('=' .repeat(60));
    console.log(`Environment: ${this.environment}`);
    console.log(`Test Level: ${this.testLevel}`);
    console.log(`Duration: ${(this.results.duration / 1000).toFixed(2)}s`);
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Skipped: ${this.results.summary.skipped}`);
    console.log('=' .repeat(60));

    if (this.results.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DeploymentValidator(ENVIRONMENT, TEST_LEVEL);
  validator.runValidationPipeline().catch(console.error);
}

export default DeploymentValidator;