import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 防御性检查
      if (!event || !shortcuts || shortcuts.length === 0) {
        return;
      }

      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' ||
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.getAttribute('contenteditable') === 'true';

      shortcuts.forEach(shortcut => {
        // 确保 event.key 和 shortcut.key 都存在且为字符串
        if (!event.key || !shortcut.key || typeof event.key !== 'string' || typeof shortcut.key !== 'string') {
          return;
        }

        try {
          const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
          const matchesCtrl = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
          const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
          const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;

          if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
            // 对于某些快捷键，即使在输入框中也要生效（如Ctrl+K搜索）
            if (isInputFocused && !shortcut.ctrl) {
              return;
            }

            event.preventDefault();
            shortcut.callback();
          }
        } catch (error) {
          console.warn('Error in keyboard shortcut handling:', error);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export const defaultShortcuts = {
  search: { key: 'k', ctrl: true, description: '打开全局搜索' },
  newChat: { key: 'n', ctrl: true, description: '新建对话' },
  switchTab: (tabNumber: number) => ({
    key: tabNumber.toString(),
    ctrl: true,
    description: `切换到标签页 ${tabNumber}`
  }),
};