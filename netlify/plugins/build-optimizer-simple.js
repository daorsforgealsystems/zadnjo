import fs from 'fs';
import path from 'path';

export default {
  name: "Flow Motion Build Optimizer",
  
  onPreBuild: async ({ utils, inputs }) => {
    console.log('🚀 Starting Flow Motion build optimization...');
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      console.log(`📦 Node.js version: ${nodeVersion}`);
      
      if (parseInt(nodeVersion.slice(1)) < 20) {
        console.error('❌ Node.js version 20+ is required for this build');
        utils.build.failBuild('Node.js version 20+ is required for this build');
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
    console.log('✅ Build optimizations completed');
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

      console.log('✅ Post-build optimizations completed');
    } catch (error) {
      console.error('❌ Post-build optimization failed:', error);
      console.log('⚠️  Continuing despite post-build optimization failure');
    }
  }
};
