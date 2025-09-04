#!/usr/bin/env node

/**
 * Build Comparison Script
 * Compares build artifacts between different builds and generates comparison reports
 * Usage: node scripts/compare-builds.js [build1-dir] [build2-dir] [output-dir]
 */

const fs = require('fs');
const path = require('path');

const BUILD1_DIR = process.argv[2] || 'dist';
const BUILD2_DIR = process.argv[3] || 'dist-previous';
const OUTPUT_DIR = process.argv[4] || 'build-reports';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

class BuildComparator {
  constructor(build1Dir, build2Dir, outputDir) {
    this.build1Dir = path.resolve(build1Dir);
    this.build2Dir = path.resolve(build2Dir);
    this.outputDir = path.resolve(outputDir);
    this.report = {
      timestamp: new Date().toISOString(),
      build1: { dir: build1Dir, assets: [] },
      build2: { dir: build2Dir, assets: [] },
      comparison: {
        newAssets: [],
        removedAssets: [],
        changedAssets: [],
        unchangedAssets: [],
        summary: {}
      }
    };

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async compare() {
    console.log('🔄 Comparing build artifacts...');

    try {
      // Analyze both builds
      this.report.build1.assets = await this.analyzeBuild(this.build1Dir);
      this.report.build2.assets = await this.analyzeBuild(this.build2Dir);

      // Perform comparison
      this.performComparison();

      // Generate summary
      this.generateSummary();

      // Save report
      this.saveReport();

      // Print results
      this.printResults();

      console.log('✅ Build comparison complete!');
    } catch (error) {
      console.error('❌ Build comparison failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeBuild(buildDir) {
    const assets = [];

    if (!fs.existsSync(buildDir)) {
      console.warn(`⚠️  Build directory not found: ${buildDir}`);
      return assets;
    }

    const walkDir = (dir, relativePath = '') => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relPath = path.join(relativePath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walkDir(fullPath, relPath);
          } else {
            assets.push({
              name: relPath,
              size: stat.size,
              mtime: stat.mtime.getTime(),
              type: this.getAssetType(path.extname(item))
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error reading directory ${dir}:`, error.message);
      }
    };

    walkDir(buildDir);
    return assets.sort((a, b) => a.name.localeCompare(b.name));
  }

  performComparison() {
    const build1Map = new Map(this.report.build1.assets.map(asset => [asset.name, asset]));
    const build2Map = new Map(this.report.build2.assets.map(asset => [asset.name, asset]));

    // Find new and changed assets
    for (const [name, asset1] of build1Map) {
      const asset2 = build2Map.get(name);
      if (!asset2) {
        this.report.comparison.newAssets.push(asset1);
      } else if (asset1.size !== asset2.size) {
        this.report.comparison.changedAssets.push({
          name,
          build1: asset1,
          build2: asset2,
          sizeDiff: asset1.size - asset2.size,
          sizeDiffKB: ((asset1.size - asset2.size) / 1024).toFixed(2)
        });
      } else {
        this.report.comparison.unchangedAssets.push(asset1);
      }
    }

    // Find removed assets
    for (const [name, asset2] of build2Map) {
      if (!build1Map.has(name)) {
        this.report.comparison.removedAssets.push(asset2);
      }
    }
  }

  generateSummary() {
    const build1Total = this.report.build1.assets.reduce((sum, asset) => sum + asset.size, 0);
    const build2Total = this.report.build2.assets.reduce((sum, asset) => sum + asset.size, 0);
    const sizeDiff = build1Total - build2Total;

    this.report.comparison.summary = {
      build1: {
        assetCount: this.report.build1.assets.length,
        totalSize: build1Total,
        totalSizeMB: (build1Total / (1024 * 1024)).toFixed(2)
      },
      build2: {
        assetCount: this.report.build2.assets.length,
        totalSize: build2Total,
        totalSizeMB: (build2Total / (1024 * 1024)).toFixed(2)
      },
      differences: {
        newAssets: this.report.comparison.newAssets.length,
        removedAssets: this.report.comparison.removedAssets.length,
        changedAssets: this.report.comparison.changedAssets.length,
        unchangedAssets: this.report.comparison.unchangedAssets.length,
        totalSizeDiff: sizeDiff,
        totalSizeDiffMB: (sizeDiff / (1024 * 1024)).toFixed(2),
        sizeChangePercent: build2Total > 0 ? ((sizeDiff / build2Total) * 100).toFixed(2) : '0.00'
      }
    };
  }

  saveReport() {
    const reportPath = path.join(this.outputDir, `build-comparison-${TIMESTAMP}.json`);
    const htmlPath = path.join(this.outputDir, `build-comparison-${TIMESTAMP}.html`);

    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`📄 JSON report saved: ${reportPath}`);

    // Generate HTML report
    const htmlContent = this.generateHTMLReport();
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`📊 HTML report saved: ${htmlPath}`);
  }

  generateHTMLReport() {
    const summary = this.report.comparison.summary;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Build Comparison Report - ${TIMESTAMP}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .summary-card.build1 { border-left: 4px solid #28a745; }
        .summary-card.build2 { border-left: 4px solid #007bff; }
        .summary-card.diff { border-left: 4px solid #ffc107; }
        .summary-title { font-size: 14px; color: #666; margin-bottom: 5px; }
        .summary-value { font-size: 24px; font-weight: bold; color: #333; }
        .changes-section { margin-bottom: 30px; }
        .change-item { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 10px; }
        .change-new { border-left: 4px solid #28a745; }
        .change-removed { border-left: 4px solid #dc3545; }
        .change-changed { border-left: 4px solid #ffc107; }
        .size-diff { font-family: monospace; font-weight: bold; }
        .size-diff.positive { color: #dc3545; }
        .size-diff.negative { color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .asset-size { text-align: right; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Build Comparison Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p><strong>Build 1:</strong> ${this.report.build1.dir} | <strong>Build 2:</strong> ${this.report.build2.dir}</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card build1">
                <div class="summary-title">Build 1 Assets</div>
                <div class="summary-value">${summary.build1.assetCount}</div>
                <div style="font-size: 14px; color: #666;">${summary.build1.totalSizeMB} MB</div>
            </div>
            <div class="summary-card build2">
                <div class="summary-title">Build 2 Assets</div>
                <div class="summary-value">${summary.build2.assetCount}</div>
                <div style="font-size: 14px; color: #666;">${summary.build2.totalSizeMB} MB</div>
            </div>
            <div class="summary-card diff">
                <div class="summary-title">Size Difference</div>
                <div class="summary-value ${summary.differences.totalSizeDiff >= 0 ? 'size-diff positive' : 'size-diff negative'}">
                    ${summary.differences.totalSizeDiff >= 0 ? '+' : ''}${summary.differences.totalSizeDiffMB} MB
                </div>
                <div style="font-size: 14px; color: #666;">${summary.differences.sizeChangePercent}% change</div>
            </div>
        </div>

        ${this.report.comparison.newAssets.length > 0 ? `
        <div class="changes-section">
            <h3>🆕 New Assets (${this.report.comparison.newAssets.length})</h3>
            ${this.report.comparison.newAssets.map(asset => `
            <div class="change-item change-new">
                <strong>${asset.name}</strong> (${this.formatBytes(asset.size)})
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${this.report.comparison.removedAssets.length > 0 ? `
        <div class="changes-section">
            <h3>🗑️ Removed Assets (${this.report.comparison.removedAssets.length})</h3>
            ${this.report.comparison.removedAssets.map(asset => `
            <div class="change-item change-removed">
                <strong>${asset.name}</strong> (${this.formatBytes(asset.size)})
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${this.report.comparison.changedAssets.length > 0 ? `
        <div class="changes-section">
            <h3>📈 Changed Assets (${this.report.comparison.changedAssets.length})</h3>
            ${this.report.comparison.changedAssets.map(change => `
            <div class="change-item change-changed">
                <strong>${change.name}</strong><br>
                Size: ${this.formatBytes(change.build1.size)} → ${this.formatBytes(change.build2.size)}
                <span class="size-diff ${change.sizeDiff >= 0 ? 'positive' : 'negative'}">
                    (${change.sizeDiff >= 0 ? '+' : ''}${change.sizeDiffKB} KB)
                </span>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <h3>📊 Asset Details</h3>
        <table>
            <thead>
                <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Build 1 Size</th>
                    <th>Build 2 Size</th>
                    <th>Difference</th>
                </tr>
            </thead>
            <tbody>
                ${this.getAllAssets().map(asset => {
                    const build1Asset = this.report.build1.assets.find(a => a.name === asset.name);
                    const build2Asset = this.report.build2.assets.find(a => a.name === asset.name);
                    const size1 = build1Asset ? build1Asset.size : 0;
                    const size2 = build2Asset ? build2Asset.size : 0;
                    const diff = size1 - size2;

                    return `
                    <tr>
                        <td>${asset.name}</td>
                        <td>${asset.type}</td>
                        <td class="asset-size">${size1 ? this.formatBytes(size1) : '-'}</td>
                        <td class="asset-size">${size2 ? this.formatBytes(size2) : '-'}</td>
                        <td class="asset-size ${diff !== 0 ? (diff > 0 ? 'size-diff positive' : 'size-diff negative') : ''}">
                            ${diff !== 0 ? `${diff > 0 ? '+' : ''}${(diff / 1024).toFixed(2)} KB` : '-'}
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  getAllAssets() {
    const allNames = new Set([
      ...this.report.build1.assets.map(a => a.name),
      ...this.report.build2.assets.map(a => a.name)
    ]);

    return Array.from(allNames)
      .map(name => {
        const build1Asset = this.report.build1.assets.find(a => a.name === name);
        const build2Asset = this.report.build2.assets.find(a => a.name === name);
        return build1Asset || build2Asset;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  printResults() {
    const summary = this.report.comparison.summary;

    console.log('\n📊 Build Comparison Summary:');
    console.log(`   Build 1 (${this.report.build1.dir}): ${summary.build1.assetCount} assets, ${summary.build1.totalSizeMB} MB`);
    console.log(`   Build 2 (${this.report.build2.dir}): ${summary.build2.assetCount} assets, ${summary.build2.totalSizeMB} MB`);
    console.log(`   Size difference: ${summary.differences.totalSizeDiff >= 0 ? '+' : ''}${summary.differences.totalSizeDiffMB} MB (${summary.differences.sizeChangePercent}%)`);

    if (this.report.comparison.newAssets.length > 0) {
      console.log(`\n🆕 New assets: ${this.report.comparison.newAssets.length}`);
    }

    if (this.report.comparison.removedAssets.length > 0) {
      console.log(`\n🗑️ Removed assets: ${this.report.comparison.removedAssets.length}`);
    }

    if (this.report.comparison.changedAssets.length > 0) {
      console.log(`\n📈 Changed assets: ${this.report.comparison.changedAssets.length}`);
      const increased = this.report.comparison.changedAssets.filter(c => c.sizeDiff > 0);
      const decreased = this.report.comparison.changedAssets.filter(c => c.sizeDiff < 0);

      if (increased.length > 0) {
        console.log(`   🔴 Increased: ${increased.length} assets`);
      }
      if (decreased.length > 0) {
        console.log(`   🟢 Decreased: ${decreased.length} assets`);
      }
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

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run comparison if called directly
if (require.main === module) {
  const comparator = new BuildComparator(BUILD1_DIR, BUILD2_DIR, OUTPUT_DIR);
  comparator.compare().catch(console.error);
}

module.exports = BuildComparator;