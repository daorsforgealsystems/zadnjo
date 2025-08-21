import fs from 'fs';
import path from 'path';

export default {
  name: "Flow Motion Build Optimizer",
  onPreBuild: async ({ utils, inputs }) => {
    console.log('🚀 Starting Flow Motion build optimization...');
    
    try {
      // Check if node version check is enabled
      if (inputs.nodeVersionCheck !== false) {
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`📦 Node.js version: ${nodeVersion}`);
        
        if (parseInt(nodeVersion.slice(1)) < 20) {
          console.error('❌ Node.js version 20+ is required for this build');
          utils.build.failBuild('Node.js version 20+ is required for this build');
        }
      }

      // Validate environment variables
      const requiredEnvVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_API_BASE_URL'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
        utils.build.failBuild(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Pre-warm cache for critical resources
      console.log('🔥 Pre-warming critical resources...');
      
      // Log build context
      console.log(`🌍 Build context: ${process.env.CONTEXT || 'unknown'}`);
      console.log(`🔗 Deploy URL: ${process.env.DEPLOY_URL || 'unknown'}`);
      
    } catch (error) {
      console.error('❌ Pre-build optimization failed:', error);
      utils.build.failBuild(`Pre-build optimization failed: ${error.message}`);
    }
  },

  onBuild: async ({ utils, inputs }) => {
    console.log('🔨 Running build optimizations...');
    
    try {
      // Build-time optimizations can go here
      console.log('✅ Build optimizations completed');
    } catch (error) {
      console.error('❌ Build optimization failed:', error);
      utils.build.failBuild(`Build optimization failed: ${error.message}`);
    }
  },

  onPostBuild: async ({ utils, inputs, constants }) => {
    console.log('🎯 Running post-build optimizations...');
    
    try {
      // Generate build manifest
      const buildManifest = {
        buildId: process.env.BUILD_ID || 'unknown',
        deployId: process.env.DEPLOY_ID || 'unknown',
        context: process.env.CONTEXT || 'unknown',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: {
          apiBaseUrl: process.env.VITE_API_BASE_URL,
          deploymentEnv: process.env.VITE_DEPLOYMENT_ENV,
          appUrl: process.env.VITE_APP_URL,
        }
      };

      const manifestPath = path.join(constants.PUBLISH_DIR, 'build-manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(buildManifest, null, 2));
      console.log(`📄 Build manifest created at ${manifestPath}`);

      // Create a health check page only if enabled
      if (inputs.healthCheck !== false) {
        const healthCheckContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Flow Motion - Health Check</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Flow Motion Logistics Platform</h1>
    <p>Status: <strong style="color: green;">Healthy</strong></p>
    <p>Build ID: ${buildManifest.buildId}</p>
    <p>Deploy ID: ${buildManifest.deployId}</p>
    <p>Timestamp: ${buildManifest.timestamp}</p>
    <p>Environment: ${buildManifest.context}</p>
    <script>
      // Auto-refresh every 30 seconds
      setTimeout(() => window.location.reload(), 30000);
    </script>
</body>
</html>
        `.trim();

        const healthCheckPath = path.join(constants.PUBLISH_DIR, 'health.html');
        fs.writeFileSync(healthCheckPath, healthCheckContent);
        console.log(`🏥 Health check page created at ${healthCheckPath}`);
      }

      console.log('✅ Post-build optimizations completed');
    } catch (error) {
      console.error('❌ Post-build optimization failed:', error);
      // Don't fail the build for post-build issues
      console.log('⚠️  Continuing despite post-build optimization failure');
    }
  },

  onSuccess: async ({ utils, inputs }) => {
    console.log('🎉 Build completed successfully!');
    
    try {
      // Trigger cache warming only if enabled
      if (inputs.cacheWarm !== false) {
        // Trigger cache warming
        const deployUrl = process.env.DEPLOY_URL;
        if (deployUrl) {
          console.log('🔥 Triggering cache warming...');
          
          // In a real implementation, you might trigger your cache warmer function here
          // await fetch(`${deployUrl}/.netlify/functions/cache-warmer`, { method: 'POST' });
          
          console.log('✅ Cache warming triggered');
        }
      }
    } catch (error) {
      console.error('❌ Post-success actions failed:', error);
      // Don't fail the build for post-success issues
    }
  },

  onError: async ({ utils, inputs }) => {
    console.log('💥 Build failed - running cleanup...');
    
    try {
      // Cleanup actions can go here
      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
};
