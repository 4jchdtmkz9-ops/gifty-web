'use client';

import { createContext, useContext } from 'react';

export type OrbitTheme = 'dark' | 'light';

export const OrbitThemeContext = createContext<{
  theme: OrbitTheme;
  toggleTheme: () => void;
}>({
  theme: 'dark',
  toggleTheme: () => undefined,
});

export function useOrbitTheme() {
  return useContext(OrbitThemeContext);
}
