import React, { useContext } from 'react';
import { ThemeContext, Theme } from '../types';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === Theme.DARK;

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-16 h-8 rounded-full transition-colors duration-300 ease-in-out flex items-center px-1
        ${isDark ? 'bg-neo-darkBg shadow-neu-pressed-dark' : 'bg-neo-bg shadow-neu-pressed'}
      `}
      aria-label="Toggle Theme"
    >
      <div
        className={`
          w-6 h-6 rounded-full shadow-md transform transition-transform duration-300
          flex items-center justify-center text-xs
          ${isDark ? 'translate-x-8 bg-gray-700 text-yellow-300' : 'translate-x-0 bg-gray-100 text-yellow-600'}
        `}
      >
        {isDark ? '☾' : '☀'}
      </div>
    </button>
  );
};