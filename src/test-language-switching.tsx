import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

const TestLanguageSwitching = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Language Switching Test</h1>
      
      <div className="space-y-4">
        <p><strong>Current Language:</strong> {i18n.language}</p>
        <p><strong>Supported Languages:</strong> {i18n.options.supportedLngs?.join(', ')}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Language Switcher Components:</h2>
        
        <div className="space-y-2">
          <p><strong>Floating variant:</strong></p>
          <LanguageSwitcher variant="floating" />
        </div>
        
        <div className="space-y-2">
          <p><strong>Compact variant:</strong></p>
          <LanguageSwitcher variant="compact" />
        </div>
        
        <div className="space-y-2">
          <p><strong>Default variant:</strong></p>
          <LanguageSwitcher variant="default" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Translation Test:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Landing Page:</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Hero Title:</strong> {t('landing.hero.title', 'Revolutionizing Logistics with AI')}</li>
              <li><strong>Get Started:</strong> {t('landing.cta.getStarted', 'Get Started')}</li>
              <li><strong>Login:</strong> {t('landing.cta.login', 'Login')}</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold">Footer:</h3>
            <ul className="space-y-1 text-sm">
              <li><strong>Company:</strong> {t('footer.company', 'Company')}</li>
              <li><strong>Services:</strong> {t('footer.services', 'Services')}</li>
              <li><strong>Support:</strong> {t('footer.support', 'Support')}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Manual Language Switch Test:</h2>
        <div className="flex gap-2 flex-wrap">
          {['en', 'bs', 'hr', 'sr', 'de-CH', 'fr-CH', 'tr'].map((lang) => (
            <button
              key={lang}
              onClick={() => i18n.changeLanguage(lang)}
              className={`px-3 py-1 rounded border ${
                i18n.language === lang 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestLanguageSwitching;