#!/usr/bin/env node

/**
 * Build Analysis Script
 * Analyzes Netlify build artifacts and generates comprehensive reports
 * Usage: node scripts/analyze-build.js [build-dir] [output-dir]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = process.argv[2] || 'dist';
const OUTPUT_DIR = process.argv[3] || 'build-reports';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

class BuildAnalyzer {
  constructor(buildDir, outputDir) {
    this.buildDir = path.resolve(buildDir);
    this.outputDir = path.resolve(outputDir);
    this.report = {
      timestamp: new Date().toISOString(),
      buildDir: this.buildDir,
      summary: {},
      assets: [],
      performance: {},
      recommendations: []
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async analyze() {
    console.log('🔍 Analyzing build artifacts...');

    try {
      await this.analyzeAssets();
      await this.analyzePerformance();
      this.generateRecommendations();
      this.saveReport();
      this.printSummary();

      console.log('✅ Build analysis complete!');
    } catch (error) {
      console.error('❌ Build analysis failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeAssets() {
    console.log('📊 Analyzing assets...');

    const assets = [];
    let totalSize = 0;
    let largestAsset = { name: '', size: 0 };

    const walkDir = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath, relPath);
        } else {
          const size = stat.size;
          totalSize += size;

          if (size > largestAsset.size) {
            largestAsset = { name: relPath, size };
          }

          const ext = path.extname(item).toLowerCase();
          const type = this.getAssetType(ext);

          assets.push({
            name: relPath,
            size,
            sizeKB: (size / 1024).toFixed(2),
            type,
            extension: ext,
            mtime: stat.mtime.toISOString()
          });
        }
      }
    };

    walkDir(this.buildDir);

    // Group by type
    const byType = assets.reduce((acc, asset) => {
      acc[asset.type] = acc[asset.type] || { count: 0, totalSize: 0, assets: [] };
      acc[asset.type].count++;
      acc[asset.type].totalSize += asset.size;
      acc[asset.type].assets.push(asset);
      return acc;
    }, {});

    this.report.assets = assets;
    this.report.summary = {
      totalAssets: assets.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      largestAsset: {
        name: largestAsset.name,
        size: largestAsset.size,
        sizeKB: (largestAsset.size / 1024).toFixed(2)
      },
      byType
    };
  }

  async analyzePerformance() {
    console.log('⚡ Analyzing performance...');

    const jsAssets = this.report.assets.filter(asset => asset.type === 'javascript');
    const cssAssets = this.report.assets.filter(asset => asset.type === 'css');

    // Check for large bundles
    const largeBundles = jsAssets.filter(asset => asset.size > 500 * 1024); // > 500KB
    const largeStyles = cssAssets.filter(asset => asset.size > 100 * 1024); // > 100KB

    // Check for uncompressed assets
    const uncompressedJS = jsAssets.filter(asset => !asset.name.includes('.min.') && !asset.name.includes('.br') && !asset.name.includes('.gz'));
    const uncompressedCSS = cssAssets.filter(asset => !asset.name.includes('.min.') && !asset.name.includes('.br') && !asset.name.includes('.gz'));

    this.report.performance = {
      javascript: {
        count: jsAssets.length,
        totalSize: jsAssets.reduce((sum, asset) => sum + asset.size, 0),
        totalSizeMB: (jsAssets.reduce((sum, asset) => sum + asset.size, 0) / (1024 * 1024)).toFixed(2),
        largeBundles: largeBundles.length,
        largestBundle: largeBundles.length > 0 ? largeBundles.reduce((max, asset) => asset.size > max.size ? asset : max) : null,
        uncompressed: uncompressedJS.length
      },
      css: {
        count: cssAssets.length,
        totalSize: cssAssets.reduce((sum, asset) => sum + asset.size, 0),
        totalSizeKB: (cssAssets.reduce((sum, asset) => sum + asset.size, 0) / 1024).toFixed(2),
        largeStyles: largeStyles.length,
        uncompressed: uncompressedCSS.length
      },
      warnings: []
    };

    // Add performance warnings
    if (largeBundles.length > 0) {
      this.report.performance.warnings.push(`⚠️  ${largeBundles.length} JavaScript bundles > 500KB`);
    }
    if (largeStyles.length > 0) {
      this.report.performance.warnings.push(`⚠️  ${largeStyles.length} CSS files > 100KB`);
    }
    if (uncompressedJS.length > 0) {
      this.report.performance.warnings.push(`⚠️  ${uncompressedJS.length} uncompressed JavaScript files`);
    }
    if (uncompressedCSS.length > 0) {
      this.report.performance.warnings.push(`⚠️  ${uncompressedCSS.length} uncompressed CSS files`);
    }
  }

  generateRecommendations() {
    console.log('💡 Generating recommendations...');

    const recommendations = [];

    // Bundle size recommendations
    if (this.report.performance.javascript.largeBundles > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Large JavaScript Bundles',
        description: `${this.report.performance.javascript.largeBundles} JavaScript bundles exceed 500KB`,
        actions: [
          'Implement code splitting for large bundles',
          'Use dynamic imports for non-critical code',
          'Enable tree shaking optimizations',
          'Consider lazy loading for heavy components'
        ]
      });
    }

    // Compression recommendations
    if (this.report.performance.javascript.uncompressed > 0 || this.report.performance.css.uncompressed > 0) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Missing Compression',
        description: 'Some assets are not compressed',
        actions: [
          'Enable gzip/brotli compression in Netlify',
          'Minify assets during build process',
          'Configure proper cache headers for compressed assets'
        ]
      });
    }

    // Asset count recommendations
    if (this.report.summary.totalAssets > 100) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'High Asset Count',
        description: `Build contains ${this.report.summary.totalAssets} assets`,
        actions: [
          'Bundle similar assets together',
          'Use asset optimization plugins',
          'Implement proper caching strategies',
          'Consider CDN optimization'
        ]
      });
    }

    this.report.recommendations = recommendations;
  }

  saveReport() {
    const reportPath = path.join(this.outputDir, `build-analysis-${TIMESTAMP}.json`);
    const htmlPath = path.join(this.outputDir, `build-report-${TIMESTAMP}.html`);

    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`📄 JSON report saved: ${reportPath}`);

    // Generate HTML report
    const htmlContent = this.generateHTMLReport();
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📊 HTML report saved: ${htmlPath}`);
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Build Analysis Report - ${TIMESTAMP}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .warnings { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .recommendations { margin-top: 30px; }
        .recommendation { background: #e7f3ff; border: 1px solid #b3d7ff; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .asset-size { text-align: right; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Build Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-title">Total Assets</div>
                <div class="metric-value">${this.report.summary.totalAssets}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Total Size</div>
                <div class="metric-value">${this.report.summary.totalSizeMB} MB</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">JS Bundles</div>
                <div class="metric-value">${this.report.performance.javascript.count}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">CSS Files</div>
                <div class="metric-value">${this.report.performance.css.count}</div>
            </div>
        </div>

        ${this.report.performance.warnings.length > 0 ? `
        <div class="warnings">
            <h3>⚠️ Performance Warnings</h3>
            <ul>
                ${this.report.performance.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            ${this.report.recommendations.map(r => `
            <div class="recommendation priority-${r.priority}">
                <h4>${r.title} (${r.priority} priority)</h4>
                <p>${r.description}</p>
                <ul>
                    ${r.actions.map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>
            `).join('')}
        </div>

        <h3>📊 Largest Assets</h3>
        <table>
            <thead>
                <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                ${this.report.assets
                    .sort((a, b) => b.size - a.size)
                    .slice(0, 10)
                    .map(asset => `
                    <tr>
                        <td>${asset.name}</td>
                        <td>${asset.type}</td>
                        <td class="asset-size">${asset.sizeKB} KB</td>
                    </tr>
                    `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  printSummary() {
    console.log('\n📈 Build Analysis Summary:');
    console.log(`   Total Assets: ${this.report.summary.totalAssets}`);
    console.log(`   Total Size: ${this.report.summary.totalSizeMB} MB`);
    console.log(`   Largest Asset: ${this.report.summary.largestAsset.name} (${this.report.summary.largestAsset.sizeKB} KB)`);

    if (this.report.performance.warnings.length > 0) {
      console.log('\n⚠️  Performance Warnings:');
      this.report.performance.warnings.forEach(w => console.log(`   ${w}`));
    }

    if (this.report.recommendations.length > 0) {
      console.log('\n💡 Key Recommendations:');
      this.report.recommendations.forEach(r => {
        console.log(`   ${r.priority.toUpperCase()}: ${r.title}`);
        console.log(`     ${r.description}`);
      });
    }
  }

  getAssetType(extension) {
    const types = {
      '.js': 'javascript',
      '.mjs': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.css': 'css',
      '.scss': 'css',
      '.sass': 'css',
      '.html': 'html',
      '.json': 'json',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.webp': 'image',
      '.ico': 'image',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font',
      '.eot': 'font'
    };
    return types[extension] || 'other';
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BuildAnalyzer(BUILD_DIR, OUTPUT_DIR);
  analyzer.analyze().catch(console.error);
}

module.exports = BuildAnalyzer;