// Simple test script to verify the plugin can be loaded
try {
  const plugin = require('./netlify/plugins/build-optimizer-simple.js');
  console.log('✅ Plugin loaded successfully');
  console.log('Plugin name:', plugin.name);
  console.log('Available hooks:', Object.keys(plugin).filter(key => !key.startsWith('_')));
} catch (error) {
  console.error('❌ Plugin loading failed:', error.message);
  console.error('Stack:', error.stack);
}
