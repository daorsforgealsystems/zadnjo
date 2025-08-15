import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when user is typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
};

// Common keyboard shortcuts
export const createCommonShortcuts = (actions: {
  toggleSidebar?: () => void;
  openSearch?: () => void;
  openSettings?: () => void;
  openHelp?: () => void;
  refresh?: () => void;
}): KeyboardShortcut[] => [
  ...(actions.toggleSidebar ? [{
    key: 'b',
    ctrlKey: true,
    action: actions.toggleSidebar,
    description: 'Toggle sidebar'
  }] : []),
  ...(actions.openSearch ? [{
    key: 'k',
    ctrlKey: true,
    action: actions.openSearch,
    description: 'Open search'
  }] : []),
  ...(actions.openSettings ? [{
    key: ',',
    ctrlKey: true,
    action: actions.openSettings,
    description: 'Open settings'
  }] : []),
  ...(actions.openHelp ? [{
    key: '?',
    shiftKey: true,
    action: actions.openHelp,
    description: 'Show help'
  }] : []),
  ...(actions.refresh ? [{
    key: 'r',
    ctrlKey: true,
    action: actions.refresh,
    description: 'Refresh data'
  }] : []),
];