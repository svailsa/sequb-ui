import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ChatSession } from '@/types/sequb';
import { api } from '@/services/api';
import { backendErrorContext } from '@/services/monitoring/backend-error-context';

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
          
          // Use backend error context to determine if we should create offline session
          try {
            const errorInfo = await backendErrorContext.formatErrorForDisplay(error);
            
            // Only create offline session for network/connection errors
            if (errorInfo.severity === 'error' && errorInfo.recoverable) {
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
            } else {
              // For non-recoverable errors, throw the error
              throw error;
            }
          } catch (contextError) {
            // Fallback if error context service fails
            console.error('Failed to get error context:', contextError);
            throw error; // Re-throw original error
          }
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
          
          try {
            // Use backend error context service for better error handling
            const errorDisplay = await backendErrorContext.formatErrorForDisplay(error);
            
            // Create user-friendly error message with suggestions
            let errorContent = `${errorDisplay.message}`;
            
            if (errorDisplay.suggestions && errorDisplay.suggestions.length > 0) {
              errorContent += '\n\n**Here are some suggestions:**\n';
              errorDisplay.suggestions.forEach((suggestion, index) => {
                errorContent += `${index + 1}. ${suggestion}\n`;
              });
            }
            
            // Add documentation links if available
            if (errorDisplay.links && errorDisplay.links.length > 0) {
              errorContent += '\n**For more help:**\n';
              errorDisplay.links.forEach(link => {
                errorContent += `• [${link.title}](${link.url}) - ${link.description}\n`;
              });
            }
            
            // Add retry information if applicable
            if (errorDisplay.recoverable && errorDisplay.retryAfter) {
              errorContent += `\n*Please wait ${errorDisplay.retryAfter} seconds before trying again.*`;
            }
            
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              session_id: currentSessionId,
              role: 'assistant',
              content: errorContent,
              timestamp: new Date().toISOString(),
            };
            addMessage(assistantMessage);
            
          } catch (contextError) {
            // Fallback if error context service also fails
            console.error('Failed to get error context:', contextError);
            
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              session_id: currentSessionId,
              role: 'assistant',
              content: 'I apologize, but the chat service is currently experiencing issues. Please try again later or contact support if the problem persists.',
              timestamp: new Date().toISOString(),
            };
            addMessage(assistantMessage);
          }
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