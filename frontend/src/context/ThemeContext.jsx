import { createContext, useContext, useEffect, useState } from 'react';
import StorageService from '../api/StorageService';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => StorageService.get('theme', 'dark'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    StorageService.set('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
