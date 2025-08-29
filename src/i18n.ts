import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";

// English translations as inline fallback
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

try {
  i18n
    .use(initReactI18next)
    .use(HttpApi) // keep backend to load /public/locales/en/translation.json
    .init({
      debug: false,
      lng: "en",                // force English only
      fallbackLng: "en",
      supportedLngs: ["en"],    // restrict to English
      interpolation: { escapeValue: false },
      backend: {
        loadPath: '/locales/{{lng}}/translation.json',
        requestOptions: { cache: 'default' }
      },
      react: { useSuspense: false },
      load: 'languageOnly',
      cleanCode: true,
      initImmediate: false,
      resources: defaultResources,
    }, (err) => {
      if (err) {
        console.warn('i18n initialization error:', err);
      }
    });
} catch (error) {
  console.error('Failed to initialize i18n:', error);
  // Fallback minimal init to prevent crashes
  i18n.use(initReactI18next).init({
    resources: defaultResources,
    lng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });
}

export default i18n;