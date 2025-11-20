import React from 'react';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  theme: Theme.LIGHT,
  toggleTheme: () => {},
});

export interface LayoutContextType {
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}

export const LayoutContext = React.createContext<LayoutContextType>({
  isChatOpen: false,
  setChatOpen: () => {},
});

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatResponse {
  output?: string;
  text?: string;
  message?: string;
  [key: string]: any;
}