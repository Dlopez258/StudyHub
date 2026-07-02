'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'studyhub_theme';

export function ThemeToggle() {
  // Inicia siempre en 'light' para que el HTML del servidor y el primer render
  // del cliente coincidan: si difieren, React descarta el árbol servido y al
  // regenerarlo se pierde el data-theme que fijó el script anti-FOUC.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    let initial: Theme = 'light';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      initial =
        stored ??
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
    setTheme(initial);
    // Reaplica el atributo por si otra parte de la página provocó una
    // regeneración de hidratación que lo haya borrado de <html>.
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-text-soft)] hover:bg-[var(--color-gray-light)] hover:text-[var(--color-text)] transition-colors"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
