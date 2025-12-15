import React, {createContext, useContext, useEffect, useState} from 'react';
import {getCurrentUserJWT, updateTheme} from '../api/auth';
import {storage} from '../utils/storage';

interface ThemeContextProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  themeLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
  themeLoaded: false,
});

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadThemeFromBackend = async () => {
      const user = await getCurrentUserJWT();
      if (user?.theme) {
        setThemeState(user.theme);
        await storage.setItem('theme', user.theme);
      }
      setThemeLoaded(true);
    };

    loadThemeFromBackend();
  }, []);

  const setTheme = async (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    await storage.setItem('theme', newTheme);
    await updateTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{theme, setTheme, themeLoaded}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
