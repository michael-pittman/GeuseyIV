import React, { useState, useEffect, useRef, useContext } from 'react';
import { Message, ChatResponse, LayoutContext } from '../types';
import { ThemeToggle } from './ThemeToggle';

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;
const WEBHOOK_MISSING = !WEBHOOK_URL;

const ICON_IDLE = 'https://www.membersoftherage.com/cdn/shop/files/frame-animation-glitch_151x151.gif?v=1701466761';
const ICON_ACTIVE = 'https://www.membersoftherage.com/cdn/shop/files/frame-animation-fire_151x151.gif?v=1701466768';

// Generate a unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Extract text from various n8n response formats
const parseResponseText = (data: ChatResponse): string => {
  // Direct string properties (most common)
  const directFields = ['output', 'text', 'message', 'response', 'chatOutput', 'reply', 'answer'];
  for (const field of directFields) {
    if (typeof data[field] === 'string') return data[field];
  }

  // Nested json object format
  if (data.json) {
    for (const field of directFields) {
      if (typeof data.json[field] === 'string') return data.json[field];
    }
  }

  // Array format from n8n
  if (Array.isArray(data) && data[0]?.json?.output) {
    return data[0].json.output;
  }

  return JSON.stringify(data);
};

export const ChatWidget: React.FC = () => {
  const { isChatOpen, setChatOpen } = useContext(LayoutContext);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', text: 'Hello its Geusey, what do you want to build?', sender: 'bot', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(generateSessionId());

  // Preload Active Icon Image to prevent flickering
  useEffect(() => {
    const img = new Image();
    img.src = ICON_ACTIVE;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatOpen]);

  // Handle mobile keyboard visibility
  useEffect(() => {
    if (!isChatOpen) return;

    const handleViewportResize = () => {
      // Scroll input into view when virtual keyboard opens
      if (document.activeElement === inputRef.current) {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    // Use visualViewport API for better mobile keyboard detection
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', handleViewportResize);
      return () => viewport.removeEventListener('resize', handleViewportResize);
    }
  }, [isChatOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Fail fast if webhook URL is not configured
    if (WEBHOOK_MISSING) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: '⚙️ Chat is not configured. Set VITE_WEBHOOK_URL in your environment.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsLoading(false);
      return;
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(WEBHOOK_URL!, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          sessionId: sessionIdRef.current,
          message: userMsg.text,
          text: userMsg.text,
          chatInput: userMsg.text 
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let replyText = "Connection lost.";
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data: ChatResponse = await response.json();
          replyText = parseResponseText(data);
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          replyText = text || "Received empty response from server.";
        }
      } else {
        const errorText = await response.text().catch(() => '');
        replyText = `⚠️ Error ${response.status}: ${errorText || response.statusText || 'Server unavailable'}`;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error: any) {
      let errorMessage = "🔌 Network Error: Could not connect to server.";

      if (error.name === 'AbortError') {
        errorMessage = "⏱️ Request timeout: The server took too long to respond.";
      } else if (error.message) {
        errorMessage = `🔌 Network Error: ${error.message}`;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "📡 Network Error: Failed to connect. Please check your connection.";
      }
      
      console.error('❌ Webhook error:', error);
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans pointer-events-none">
      
      {/* iOS26 Liquid Glass Window */}
      {isChatOpen && (
        <div className="
          pointer-events-auto
          mb-6 w-[90vw] sm:w-[360px] h-[50vh] sm:h-[450px]
          rounded-[20px] rounded-br-md
          flex flex-col overflow-hidden
          border border-white/20 dark:border-white/5
          shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]
          drop-shadow-[0_8px_8px_rgba(0,0,0,0.15)]
          animate-[fadeIn_0.2s_ease-out_forwards]
          origin-bottom-right
          backdrop-blur-2xl
          bg-white/5 dark:bg-black/20
          text-gray-800 dark:text-gray-100
        ">
          
          {/* Liquid Header */}
          <div className="
            flex-shrink-0 h-[44px]
            bg-white/5 dark:bg-white/5
            border-b border-white/10
            flex items-center px-4 justify-between select-none
            backdrop-blur-md
            relative
          ">
            {/* Traffic Lights */}
            <div className="flex gap-[8px] group z-10">
              <button 
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
                className="w-[12px] h-[12px] rounded-full bg-red-500/80 hover:bg-red-500 border border-red-400/30 shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all cursor-pointer pointer-events-auto"
              ></button>
              <div className="w-[12px] h-[12px] rounded-full bg-yellow-400/80 border border-yellow-300/30 shadow-[0_0_10px_rgba(250,204,21,0.4)]"></div>
              <div className="w-[12px] h-[12px] rounded-full bg-green-500/80 border border-green-400/30 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
            </div>

            {/* Absolute Centered Title */}
            <a 
              href="mailto:info@geuse.io?subject=Geuse.io%20Inquiry&body=I%20would%20like%20your%20services%20to..."
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] font-mono tracking-widest text-black/60 dark:text-white/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline pointer-events-auto uppercase"
            >
              GESUE
            </a>

            {/* Theme Toggle (Right Justified) */}
            <div className="flex items-center justify-end z-10 gap-3">
               <div className="transform scale-75 origin-right pointer-events-auto">
                 <ThemeToggle />
               </div>
            </div>
          </div>

          {/* Liquid Content Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
               {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                      
                      {/* Bubble - Liquid + Brutal */}
                      <div 
                        className={`
                          relative px-4 py-2.5 text-[14px] leading-relaxed backdrop-blur-xl shadow-lg
                          ${isUser 
                            ? 'bg-gradient-to-br from-blue-500/70 to-purple-600/70 text-white border border-white/20 rounded-2xl rounded-br-sm shadow-[4px_4px_0px_rgba(0,0,0,0.2)]' 
                            : 'bg-white/20 dark:bg-white/5 text-gray-900 dark:text-gray-100 border border-white/20 dark:border-white/10 rounded-2xl rounded-bl-sm shadow-[4px_4px_0px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0px_rgba(0,0,0,0.3)]'
                          }
                        `}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
               {isLoading && (
                 <div className="flex w-full justify-start pl-10">
                   <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-0"></div>
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-150"></div>
                   </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Liquid Input Area with Integrated Button */}
          <div className="
             p-3
             bg-white/5 dark:bg-white/5
             border-t border-white/10
             backdrop-blur-md
          ">
             <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="iMessage"
                  aria-label="Type a message"
                  inputMode="text"
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  className="
                    w-full pl-4 pr-12 py-3
                    bg-white/5 dark:bg-white/5
                    text-sm text-gray-800 dark:text-white
                    rounded-full
                    border border-white/10 dark:border-white/5
                    shadow-[inset_2px_2px_6px_rgba(0,0,0,0.05),inset_-2px_-2px_6px_rgba(255,255,255,0.1)]
                    focus:outline-none focus:bg-white/10
                    placeholder-gray-500/70 dark:placeholder-gray-400/70
                    transition-all duration-300
                  "
                />
             
                {/* Send Button - Integrated inside Input */}
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    aria-label="Send message"
                    className={`
                      absolute right-1.5 top-1/2 -translate-y-1/2
                      w-8 h-8 rounded-full flex items-center justify-center
                      transition-all duration-300 active:scale-90
                      ${inputValue.trim()
                        ? 'bg-[#007AFF] text-white shadow-[2px_2px_5px_rgba(0,0,0,0.2)] hover:brightness-110'
                        : 'bg-transparent text-gray-400/50 cursor-default'
                      }
                    `}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                </button>
             </div>
          </div>

        </div>
      )}

      {/* Updated Toggle Button */}
      <button
        type="button"
        onClick={() => setChatOpen(!isChatOpen)}
        aria-label={isChatOpen ? "Close chat" : "Open chat"}
        className="
          pointer-events-auto relative w-16 h-16
          transition-transform duration-300 active:scale-90
          rounded-xl
        "
      >
        <img 
          src={isChatOpen ? ICON_ACTIVE : ICON_IDLE} 
          alt="Chat" 
          className="w-full h-full object-cover rounded-xl"
        />
      </button>

    </div>
  );
};