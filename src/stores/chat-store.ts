import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, ChatSession } from '@/types/sequb';
import { api } from '@/lib/api';

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
          const response = await api.post('/api/v1/chat/sessions', {
            title: title || `Chat ${new Date().toLocaleDateString()}`
          });
          
          const newSession = response.data;
          set(state => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id,
            messages: []
          }));
          
          return newSession.id;
        } catch (error) {
          console.error('Failed to create session:', error);
          // Fallback to local session
          const newSession: ChatSession = {
            id: Date.now().toString(),
            title: title || `Chat ${new Date().toLocaleDateString()}`,
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
          const response = await api.get('/api/v1/chat/sessions');
          set({ sessions: response.data || [] });
        } catch (error) {
          console.error('Failed to load sessions:', error);
          // Keep local sessions if backend is unavailable
        }
      },

      switchSession: async (sessionId: string) => {
        try {
          const response = await api.get(`/api/v1/chat/sessions/${sessionId}/messages`);
          set({
            currentSessionId: sessionId,
            messages: response.data || []
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
          await api.delete(`/api/v1/chat/sessions/${sessionId}`);
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
          await api.patch(`/api/v1/chat/sessions/${sessionId}`, { title });
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
          const response = await api.post(`/api/v1/chat/sessions/${currentSessionId}/messages`, {
            content,
            role: 'user'
          });

          // The backend should return the assistant's response
          if (response.data.assistant_response) {
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              session_id: currentSessionId,
              role: 'assistant',
              content: response.data.assistant_response.content,
              timestamp: new Date().toISOString(),
            };
            addMessage(assistantMessage);
          }
        } catch (error) {
          console.error('Chat error:', error);
          // Fallback response
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            session_id: currentSessionId,
            role: 'assistant',
            content: `I understand you want to: "${content}". Let me help you create a workflow for that.\n\nI'm working on setting up the backend integration. For now, this is a placeholder response. Soon I'll be able to:\n\n• Analyze your request\n• Suggest appropriate workflow nodes\n• Create and execute workflows\n• Monitor execution progress\n\nStay tuned for full functionality!`,
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