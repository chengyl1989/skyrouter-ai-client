'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light';
  actualTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: 'light' = 'light';
  const actualTheme: 'light' = 'light';

  // 确保移除dark类
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
  }, []);

  const contextValue: ThemeContextType = {
    theme,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}