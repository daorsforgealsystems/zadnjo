/**
 * Service Worker Registration
 * Handles PWA service worker registration with proper error handling
 */

export interface ServiceWorkerRegistrationResult {
  success: boolean;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

/**
 * Register the service worker with proper error handling
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistrationResult> {
  // Only register in production and if service workers are supported
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
    return { success: false };
  }

  // Allow disabling SW for synthetic tests or debugging
  const params = new URLSearchParams(window.location.search);
  const userAgent = navigator.userAgent || '';
  const isHeadless = /HeadlessChrome|Playwright|Puppeteer/i.test(userAgent);
  const disabledByParam = params.get('no-sw') === '1';
  if (isHeadless || disabledByParam) {
    console.info('Service worker registration skipped (headless or ?no-sw=1).');
    return { success: false };
  }

  try {
    // Wait for the page to load before registering
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    console.log('Registering service worker...');

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });

    console.log('Service worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user and attempt a safe update
            console.log('New content available! Activating update.');

            // Ensure we don't get into a reload loop
            const alreadyReloaded = sessionStorage.getItem('sw-updated-reloaded') === '1';

            // Ask SW to skip waiting so it takes control on next nav
            registration.waiting?.postMessage({ type: 'SKIP_WAITING' });

            // Dispatch an event for the app to optionally handle a toast/UX
            window.dispatchEvent(new CustomEvent('sw-update-available', {
              detail: { registration }
            }));

            if (!alreadyReloaded) {
              sessionStorage.setItem('sw-updated-reloaded', '1');
              // Give the SW a brief moment to activate, then reload once
              setTimeout(() => {
                window.location.reload();
              }, 500);
            } else {
              console.info('Update applied without forced reload due to prior refresh.');
            }
          }
        });
      }
    });

    return { success: true, registration };
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('Service worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if service worker is supported and registered
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
}

// Auto-register when this module is imported (only in production)
if (!import.meta.env.DEV) {
  registerServiceWorker().catch(error => {
    console.warn('Auto service worker registration failed:', error);
  });
}