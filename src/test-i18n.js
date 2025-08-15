// Quick test to verify i18n configuration
import i18n from './i18n.ts';

console.log('Testing i18n configuration...');
console.log('Supported languages:', i18n.options.supportedLngs);
console.log('Current language:', i18n.language);
console.log('Fallback language:', i18n.options.fallbackLng);

// Test language switching
setTimeout(() => {
  console.log('Switching to Bosnian...');
  i18n.changeLanguage('bs').then(() => {
    console.log('Current language after switch:', i18n.language);
  });
}, 1000);

setTimeout(() => {
  console.log('Switching to English...');
  i18n.changeLanguage('en').then(() => {
    console.log('Current language after switch:', i18n.language);
  });
}, 2000);