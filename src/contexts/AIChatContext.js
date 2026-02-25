import React, { createContext, useState, useContext, useCallback } from 'react';

const AIChatContext = createContext();

export const useAIChat = () => useContext(AIChatContext);

export const AIChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'שלום! אני טריפי 🌍 — העוזר החכם לתכנון הטיול שלך.\n\nשאל אותי כל דבר: יעדים, מסלולים, תקציב, ויזות, מה לארוז ועוד!'
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  }, []);

  const updateLastAssistant = useCallback((content) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content };
      } else {
        copy.push({ role: 'assistant', content });
      }
      return copy;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'שלום! אני טריפי 🌍 — העוזר החכם לתכנון הטיול שלך.\n\nשאל אותי כל דבר: יעדים, מסלולים, תקציב, ויזות, מה לארוז ועוד!'
      }
    ]);
  }, []);

  return (
    <AIChatContext.Provider value={{
      isOpen, open, close, toggle,
      messages, addMessage, updateLastAssistant, clearHistory,
      isStreaming, setIsStreaming
    }}>
      {children}
    </AIChatContext.Provider>
  );
};
