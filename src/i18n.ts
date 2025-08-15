import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

// Default English translations as fallback
const defaultResources = {
  en: {
    translation: {
      "app.name": "DAORS Flow Motion",
      "app.loading": "Loading...",
      "app.error": "Error",
      "common.retry": "Retry",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.view": "View",
      "common.search": "Search",
      "common.filter": "Filter",
      "common.sort": "Sort",
      "common.back": "Back",
      "common.next": "Next",
      "common.previous": "Previous",
      "common.submit": "Submit",
      "common.reset": "Reset",
      "common.close": "Close",
      "common.open": "Open",
      "common.yes": "Yes",
      "common.no": "No",
      "common.ok": "OK",
      "common.confirm": "Confirm",
      "common.loading": "Loading...",
      "common.success": "Success",
      "common.error": "Error",
      "common.warning": "Warning",
      "common.info": "Information"
    }
  }
};

// Initialize i18n with more resilient configuration
try {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .use(HttpApi)
    .init({
      debug: false,
      fallbackLng: "en",
      supportedLngs: ["bs", "en", "hr", "sr", "de-CH", "fr-CH", "tr"],
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      backend: {
        loadPath: '/locales/{{lng}}/translation.json',
        requestOptions: {
          cache: 'default'
        }
      },
      detection: {
        order: ['localStorage', 'cookie', 'navigator'],
        caches: ['localStorage', 'cookie']
      },
      react: {
        useSuspense: false
      },
      // Add timeout and retry options
      load: 'languageOnly',
      cleanCode: true,
      // Prevent hanging on network issues
      initImmediate: false,
      // Add fallback resources
      resources: defaultResources,
      // Add retry options
      retry: 5,
      // Add timeout
      requestTimeout: 5000
    }, (err, t) => {
      if (err) {
        console.warn('i18n initialization error:', err);
        // Continue with fallback language
        return;
      }
      console.log('i18n initialized successfully');
      console.log('Current language:', i18n.language);
    });
} catch (error) {
  console.error('Failed to initialize i18n:', error);
  // Initialize with minimal configuration to prevent app from crashing
  i18n
    .use(initReactI18next)
    .init({
      resources: defaultResources,
      lng: "en",
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });
}

export default i18n;
