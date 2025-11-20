import React, { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { ChatWidget } from './components/ChatWidget';
import { ThemeContext, Theme, LayoutContext } from './types';

const App: React.FC = () => {
  // Initialize theme from system preference
  const [theme, setTheme] = useState<Theme>(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return Theme.DARK;
    }
    return Theme.LIGHT;
  });

  const [isChatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.DARK) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <LayoutContext.Provider value={{ isChatOpen, setChatOpen }}>
        <div className="relative w-full h-full bg-neo-bg dark:bg-neo-darkBg transition-colors duration-500 overflow-hidden">
          
          {/* 3D Background Layer */}
          <div className="absolute inset-0 z-0">
            <Scene />
          </div>

          {/* UI Overlay Layer - Chat Widget handles its own fixed positioning */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <ChatWidget />
          </div>

        </div>
      </LayoutContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;