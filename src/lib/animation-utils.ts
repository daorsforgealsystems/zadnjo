// Theme transition animation
export function animateThemeChange() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.zIndex = '9999';
  overlay.style.transition = 'opacity 0.3s ease';
  
  // Get current theme color from body class
  const isDark = document.body.classList.contains('dark');
  overlay.style.backgroundColor = isDark ? '#000000' : '#ffffff';
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }, 50);
}

// Toast notification animation using CSS transitions
export function animateToast(element: HTMLElement) {
  element.style.transform = 'translateY(-20px)';
  element.style.opacity = '0';
  element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  
  requestAnimationFrame(() => {
    element.style.transform = 'translateY(0)';
    element.style.opacity = '1';
  });
}

// Page transition animation using CSS transitions
export function animatePageTransition() {
  const main = document.querySelector('main');
  if (main) {
    main.style.opacity = '0';
    main.style.transform = 'translateY(20px)';
    main.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    requestAnimationFrame(() => {
      main.style.opacity = '1';
      main.style.transform = 'translateY(0)';
    });
  }
}

// Button hover animation using CSS transitions
export function animateButtonHover(element: HTMLElement) {
  element.style.transition = 'transform 0.2s ease-in';
  element.style.transform = 'scale(1.05)';
  
  const resetScale = () => {
    element.style.transform = 'scale(1)';
    element.removeEventListener('mouseleave', resetScale);
  };
  
  element.addEventListener('mouseleave', resetScale);
}

// Form input focus animation using CSS transitions
export function animateInputFocus(element: HTMLElement) {
  element.style.transition = 'border-color 0.3s ease-in-out';
  element.style.borderColor = '#3b82f6';
  
  const resetBorder = () => {
    element.style.borderColor = '#93c5fd';
    element.removeEventListener('blur', resetBorder);
  };
  
  element.addEventListener('blur', resetBorder);
}
