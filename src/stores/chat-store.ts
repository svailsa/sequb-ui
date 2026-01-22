import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ChatSession } from '@/types/sequb';
import { api } from '@/services/api';

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  
  // Session actions
  createSession: (title?: string) => Promise<string>;
  loadSessions: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  
  // Message actions
  addMessage: (message: ChatMessage) => void;
  sendMessage: (content: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  
  // Current session getter
  getCurrentSession: () => ChatSession | undefined;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,

      createSession: async (title?: string) => {
        try {
          const response = await api.chat.createSession();
          
          const newSession = {
            ...response.data.data,
            title: title || `Chat ${new Date().toLocaleDateString()}`
          };
          
          set(state => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id,
            messages: []
          }));
          
          return newSession.id;
        } catch (error) {
          console.error('Failed to create session:', error);
          // Simplified fallback - create local session with clear offline indicator
          const newSession: ChatSession = {
            id: `offline_${Date.now()}`,
            title: title || `Offline Chat`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: 0
          };
          
          set(state => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id,
            messages: []
          }));
          
          return newSession.id;
        }
      },

      loadSessions: async () => {
        try {
          const response = await api.chat.getSessions();
          set({ sessions: response.data.data || [] });
        } catch (error) {
          console.error('Failed to load sessions:', error);
          // Keep local sessions if backend is unavailable
        }
      },

      switchSession: async (sessionId: string) => {
        try {
          const response = await api.chat.getMessages(sessionId);
          set({
            currentSessionId: sessionId,
            messages: response.data.data || []
          });
        } catch (error) {
          console.error('Failed to load session messages:', error);
          // Fallback to switching session without loading messages
          set({
            currentSessionId: sessionId,
            messages: []
          });
        }
      },

      deleteSession: async (sessionId: string) => {
        try {
          await api.chat.deleteSession(sessionId);
        } catch (error) {
          console.error('Failed to delete session from backend:', error);
        }
        
        set(state => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);
          const newCurrentId = state.currentSessionId === sessionId 
            ? (newSessions[0]?.id || null)
            : state.currentSessionId;
          
          return {
            sessions: newSessions,
            currentSessionId: newCurrentId,
            messages: state.currentSessionId === sessionId ? [] : state.messages
          };
        });
      },

      updateSessionTitle: async (sessionId: string, title: string) => {
        try {
          await api.chat.updateSession(sessionId, { title });
        } catch (error) {
          console.error('Failed to update session title:', error);
        }
        
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId 
              ? { ...session, title, updated_at: new Date().toISOString() }
              : session
          )
        }));
      },

      addMessage: (message: ChatMessage) => {
        set(state => ({
          messages: [...state.messages, message],
          sessions: state.sessions.map(session =>
            session.id === state.currentSessionId
              ? { 
                  ...session, 
                  message_count: session.message_count + 1,
                  updated_at: new Date().toISOString()
                }
              : session
          )
        }));
      },

      sendMessage: async (content: string) => {
        const { currentSessionId, addMessage } = get();
        
        if (!currentSessionId) {
          throw new Error('No active session');
        }

        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          session_id: currentSessionId,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };

        addMessage(userMessage);
        set({ isLoading: true });

        try {
          const response = await api.chat.sendMessage(content, currentSessionId);

          // The backend should return the assistant's response
          if (response.data.data?.content) {
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              session_id: currentSessionId,
              role: 'assistant',
              content: response.data.data.content,
              timestamp: new Date().toISOString(),
            };
            addMessage(assistantMessage);
          }
        } catch (error) {
          console.error('Chat error:', error);
          
          // Simplified fallback - just indicate service unavailable
          let fallbackContent = 'I apologize, but the chat service is currently unavailable. Please try again later.';
          
          // Check if it's a network error vs other errors
          if (error && typeof error === 'object' && 'response' in error) {
            const statusCode = (error as any).response?.status;
            if (statusCode === 503) {
              fallbackContent = 'The chat service is temporarily unavailable for maintenance. Please try again shortly.';
            } else if (statusCode >= 500) {
              fallbackContent = 'There was a server error. Our team has been notified and is working to resolve this issue.';
            }
          } else if (error && typeof error === 'object' && 'message' in error && (error as any).message.includes('Network Error')) {
            fallbackContent = 'Unable to connect to the chat service. Please check your internet connection and try again.';
          }
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            session_id: currentSessionId,
            role: 'assistant',
            content: fallbackContent,
            timestamp: new Date().toISOString(),
          };
          addMessage(assistantMessage);
        } finally {
          set({ isLoading: false });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find(s => s.id === currentSessionId);
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);