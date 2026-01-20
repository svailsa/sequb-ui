"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, Edit3, Check, X, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { ChatSession } from "@/types/sequb";

export function ChatHistorySidebar() {
  const {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    loadSessions
  } = useChatStore();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleNewChat = async () => {
    await createSession();
  };

  const handleSessionClick = async (sessionId: string) => {
    if (sessionId !== currentSessionId) {
      await switchSession(sessionId);
    }
  };

  const startEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveTitle = async (sessionId: string) => {
    if (editTitle.trim()) {
      await updateSessionTitle(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
    setEditTitle("");
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditTitle("");
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      await deleteSession(sessionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 bg-muted/30 border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button 
          onClick={handleNewChat}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative flex items-center p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                currentSessionId === session.id && "bg-muted"
              )}
            >
              {editingSessionId === session.id ? (
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle(session.id);
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="flex-1 text-sm bg-background border border-border rounded px-2 py-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => saveTitle(session.id)}
                    className="p-1 h-6 w-6"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEditing}
                    className="p-1 h-6 w-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {session.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(session.updated_at)} • {session.message_count} messages
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons - shown on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(session);
                      }}
                      className="p-1 h-6 w-6"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id);
                      }}
                      className="p-1 h-6 w-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No chats yet. Start a new conversation!
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Chat History
        </div>
      </div>
    </div>
  );
}