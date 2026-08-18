import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Theme state for the whole public site.
 *
 * The theme lives on the `.landing-container` element of each page, never on
 * html or body (owner law): the trading app owns those tokens and a stray
 * data-theme on the root would leak across artifacts in the workspace shell.
 * Persistence uses the same `midnat-theme` key the app uses, so a visitor who
 * chose dark in the product does not get flashed light here.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'midnat-theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    /* storage can be unavailable in private mode or a partitioned iframe */
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the session still flips; persistence is best effort */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* see above */
      }
      return next;
    });
  }, []);

  /* The browser chrome around the page (address bar, form controls) should
     follow the page, not fight it. This is the one thing that must be set
     outside the container, because only the document element carries it. */
  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    const meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#050706' : '#F4FBF8');
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
