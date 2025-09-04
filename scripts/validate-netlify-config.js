#!/usr/bin/env node

/**
 * Netlify Configuration Validator
 * Validates environment variables, redirects, headers, and other Netlify configuration
 * Usage: node scripts/validate-netlify-config.js [context]
 */

import fs from 'fs';
import path from 'path';
import toml from 'toml';

const CONTEXT = process.argv[2] || 'production';
const NETLIFY_CONFIG = 'netlify.toml';

class NetlifyConfigValidator {
  constructor(context) {
    this.context = context;
    this.config = null;
    this.issues = [];
    this.warnings = [];
    this.validations = 0;
    this.passed = 0;
  }

  async validate() {
    console.log(`🔍 Validating Netlify configuration for ${this.context} context...`);

    try {
      await this.loadConfig();
      await this.validateBuildSettings();
      await this.validateEnvironmentVariables();
      await this.validateRedirects();
      await this.validateHeaders();
      await this.validateEdgeFunctions();
      await this.validateFunctions();
      await this.validateSecurityHeaders();

      this.printResults();
      this.saveReport();

      console.log('✅ Configuration validation complete!');
    } catch (error) {
      console.error('❌ Configuration validation failed:', error.message);
      process.exit(1);
    }
  }

  async loadConfig() {
    if (!fs.existsSync(NETLIFY_CONFIG)) {
      throw new Error(`Netlify config file not found: ${NETLIFY_CONFIG}`);
    }

    const configContent = fs.readFileSync(NETLIFY_CONFIG, 'utf8');
    this.config = toml.parse(configContent);
    console.log('📄 Loaded Netlify configuration');
  }

  async validateBuildSettings() {
    console.log('🔧 Validating build settings...');

    this.validateField('build.command', 'Build command is required');
    this.validateField('build.publish', 'Publish directory is required');

    // Check if publish directory exists
    if (this.config.build?.publish) {
      const publishDir = this.config.build.publish;
      if (!fs.existsSync(publishDir)) {
        this.addWarning(`Publish directory does not exist: ${publishDir}`);
      }
    }

    // Validate Node version
    if (this.config.build?.environment?.NODE_VERSION) {
      const nodeVersion = this.config.build.environment.NODE_VERSION;
      if (!nodeVersion.match(/^(\d+|latest)$/)) {
        this.addIssue(`Invalid Node version format: ${nodeVersion}`);
      }
    }

    // Check for debug settings
    if (this.context === 'production') {
      if (this.config.build?.environment?.VITE_DEBUG_BUILD === 'true') {
        this.addWarning('VITE_DEBUG_BUILD should be disabled in production');
      }
      if (this.config.build?.environment?.NETLIFY_DEBUG === 'true') {
        this.addWarning('NETLIFY_DEBUG should be disabled in production');
      }
    }
  }

  async validateEnvironmentVariables() {
    console.log('🌍 Validating environment variables...');

    const envVars = this.config.build?.environment || {};

    // Required environment variables for different contexts
    const requiredVars = {
      production: ['NODE_VERSION', 'NPM_VERSION'],
      staging: ['NODE_VERSION', 'NPM_VERSION'],
      'deploy-preview': ['NODE_VERSION', 'NPM_VERSION']
    };

    const contextRequired = requiredVars[this.context] || [];
    for (const varName of contextRequired) {
      if (!envVars[varName]) {
        this.addIssue(`Required environment variable missing: ${varName}`);
      }
    }

    // Check for sensitive data in environment variables
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key.*private/i,
      /token/i
    ];

    for (const [key, value] of Object.entries(envVars)) {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(key) && typeof value === 'string' && !value.startsWith('$')) {
          this.addWarning(`Potentially sensitive environment variable found: ${key}`);
          break;
        }
      }
    }

    // Validate memory settings
    if (envVars.NODE_OPTIONS) {
      if (!envVars.NODE_OPTIONS.includes('--max-old-space-size')) {
        this.addWarning('Consider increasing Node.js memory limit with --max-old-space-size');
      }
    }
  }

  async validateRedirects() {
    console.log('🔀 Validating redirects...');

    const redirects = this.config.redirects || [];

    for (let i = 0; i < redirects.length; i++) {
      const redirect = redirects[i];

      if (!redirect.from) {
        this.addIssue(`Redirect ${i}: missing 'from' field`);
      }
      if (!redirect.to) {
        this.addIssue(`Redirect ${i}: missing 'to' field`);
      }

      // Validate redirect patterns
      if (redirect.from && !redirect.from.startsWith('/')) {
        this.addIssue(`Redirect ${i}: 'from' should start with '/'`);
      }

      // Check for external redirects in production
      if (this.context === 'production' && redirect.to && redirect.to.startsWith('http')) {
        this.addWarning(`Redirect ${i}: external redirect in production - ensure target is trusted`);
      }

      // Validate status codes
      if (redirect.status && ![200, 301, 302, 307, 308, 404].includes(redirect.status)) {
        this.addIssue(`Redirect ${i}: invalid status code ${redirect.status}`);
      }
    }
  }

  async validateHeaders() {
    console.log('📋 Validating headers...');

    const headers = this.config.headers || [];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];

      if (!header.for) {
        this.addIssue(`Header ${i}: missing 'for' field`);
      }

      if (!header.values || Object.keys(header.values).length === 0) {
        this.addIssue(`Header ${i}: missing 'values' field`);
      }

      // Validate CSP header
      if (header.values && header.values['Content-Security-Policy']) {
        const csp = header.values['Content-Security-Policy'];
        if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
          this.addWarning(`Header ${i}: CSP contains unsafe directives`);
        }
      }

      // Check for security headers
      const securityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];

      if (this.context === 'production' && header.for === '/*') {
        for (const secHeader of securityHeaders) {
          if (!header.values || !header.values[secHeader]) {
            this.addWarning(`Missing security header: ${secHeader}`);
          }
        }
      }
    }
  }

  async validateEdgeFunctions() {
    console.log('⚡ Validating edge functions...');

    const edgeFunctions = this.config.edge_functions || [];

    for (let i = 0; i < edgeFunctions.length; i++) {
      const edgeFunc = edgeFunctions[i];

      if (!edgeFunc.function) {
        this.addIssue(`Edge function ${i}: missing 'function' field`);
      }

      if (!edgeFunc.path) {
        this.addIssue(`Edge function ${i}: missing 'path' field`);
      }

      // Check if function file exists
      if (edgeFunc.function) {
        const funcPath = path.join('netlify', 'edge-functions', `${edgeFunc.function}.js`);
        if (!fs.existsSync(funcPath)) {
          this.addIssue(`Edge function ${edgeFunc.function}: file not found at ${funcPath}`);
        }
      }
    }

    // Check edge functions directory
    const edgeDir = 'netlify/edge-functions';
    if (edgeFunctions.length > 0 && !fs.existsSync(edgeDir)) {
      this.addIssue(`Edge functions directory not found: ${edgeDir}`);
    }
  }

  async validateFunctions() {
    console.log('🔧 Validating functions...');

    if (this.config.functions) {
      // Check functions directory
      if (this.config.functions.directory) {
        const funcDir = this.config.functions.directory;
        if (!fs.existsSync(funcDir)) {
          this.addIssue(`Functions directory not found: ${funcDir}`);
        }
      }

      // Validate function settings
      if (this.config.functions.node_bundler) {
        const validBundlers = ['esbuild', 'webpack', 'zisi'];
        if (!validBundlers.includes(this.config.functions.node_bundler)) {
          this.addIssue(`Invalid node_bundler: ${this.config.functions.node_bundler}`);
        }
      }
    }
  }

  async validateSecurityHeaders() {
    console.log('🔒 Validating security configuration...');

    const headers = this.config.headers || [];

    // Check for HTTPS enforcement
    let hasHSTS = false;
    let hasFrameOptions = false;
    let hasCSP = false;

    for (const header of headers) {
      if (header.values) {
        if (header.values['Strict-Transport-Security']) hasHSTS = true;
        if (header.values['X-Frame-Options']) hasFrameOptions = true;
        if (header.values['Content-Security-Policy']) hasCSP = true;
      }
    }

    if (this.context === 'production') {
      if (!hasHSTS) {
        this.addWarning('Missing Strict-Transport-Security header for HTTPS enforcement');
      }
      if (!hasFrameOptions) {
        this.addWarning('Missing X-Frame-Options header for clickjacking protection');
      }
      if (!hasCSP) {
        this.addWarning('Missing Content-Security-Policy header');
      }
    }
  }

  validateField(fieldPath, errorMessage) {
    this.validations++;
    const value = this.getNestedValue(this.config, fieldPath);
    if (!value) {
      this.addIssue(errorMessage);
      return false;
    }
    this.passed++;
    return true;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  addIssue(message) {
    this.issues.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  printResults() {
    console.log('\n📊 Validation Results:');
    console.log(`   Context: ${this.context}`);
    console.log(`   Validations: ${this.passed}/${this.validations} passed`);

    if (this.issues.length > 0) {
      console.log(`\n❌ Issues Found (${this.issues.length}):`);
      this.issues.forEach(issue => console.log(`   • ${issue}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️ Warnings (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All validations passed!');
    }
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      context: this.context,
      summary: {
        validations: this.validations,
        passed: this.passed,
        issues: this.issues.length,
        warnings: this.warnings.length
      },
      issues: this.issues,
      warnings: this.warnings,
      config: this.config
    };

    const reportPath = `netlify-config-validation-${this.context}-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new NetlifyConfigValidator(CONTEXT);
  validator.validate().catch(console.error);
}

export default NetlifyConfigValidator;