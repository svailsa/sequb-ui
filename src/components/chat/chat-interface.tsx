"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useUIConfiguration } from "@/components/providers/ui-configuration-provider";

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    currentSessionId,
    sendMessage,
    createSession,
    getCurrentSession
  } = useChatStore();

  const { 
    getChatExamples, 
    getConfigValue, 
    isFeatureEnabled 
  } = useUIConfiguration();

  const currentSession = getCurrentSession();
  const isOfflineMode = currentSession?.id?.startsWith('offline_');
  
  // Get backend-driven configuration
  const chatExamples = getChatExamples();
  const maxMessageLength = getConfigValue('chat.maxMessageLength') || 4000;
  const suggestionDelay = getConfigValue('chat.suggestionDelay') || 1000;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with a session if none exists
  useEffect(() => {
    if (!currentSessionId) {
      createSession();
    }
  }, [currentSessionId, createSession]);

  const handleSendMessage = async () => {
    const inputValue = textareaRef.current?.value.trim();
    if (!inputValue || isLoading) return;

    try {
      await sendMessage(inputValue);
      if (textareaRef.current) {
        textareaRef.current.value = '';
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const maxHeight = 200; // Maximum height in pixels
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustTextareaHeight(e.target);
  };

  const newChatHandler = async () => {
    await createSession();
    if (textareaRef.current) {
      textareaRef.current.value = '';
      textareaRef.current.style.height = 'auto';
    }
  };

  const fillInput = (text: string) => {
    if (textareaRef.current) {
      textareaRef.current.value = text;
      adjustTextareaHeight(textareaRef.current);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header with New Chat button */}
      {messages.length > 0 && (
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="font-medium">Sequb Assistant</span>
            {isOfflineMode && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
            <StatusIndicator type="compact" />
          </div>
          <Button variant="outline" size="sm" onClick={newChatHandler}>
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Welcome screen
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center max-w-md space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Welcome to Sequb</h1>
                <p className="text-muted-foreground">
                  I can help you create and manage workflows using natural language. 
                  Start by describing what you want to automate.
                </p>
              </div>
              <div className="grid gap-3 text-sm">
                {chatExamples.map((example) => (
                  <div 
                    key={example.id}
                    className="p-3 border border-border rounded-lg text-left hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => fillInput(example.prompt)}
                  >
                    <div className="font-medium">
                      {example.icon} {example.title}
                    </div>
                    <div className="text-muted-foreground">
                      {example.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="space-y-4 px-4 py-6 max-w-4xl mx-auto w-full">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className={cn(
                  "flex items-center space-x-2 text-sm",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}>
                  {message.role === "assistant" && (
                    <>
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="font-medium">Assistant</span>
                    </>
                  )}
                  {message.role === "user" && (
                    <>
                      <span className="font-medium">You</span>
                      <User className="w-4 h-4" />
                    </>
                  )}
                </div>
                <div className={cn(
                  "prose prose-sm max-w-none",
                  message.role === "user" ? "ml-auto max-w-2xl" : "mr-auto max-w-4xl"
                )}>
                  <div className={cn(
                    "rounded-xl px-4 py-3",
                    message.role === "assistant"
                      ? "bg-muted/50"
                      : "bg-primary text-primary-foreground ml-auto"
                  )}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="font-medium">Assistant</span>
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3 max-w-fit">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end space-x-3 bg-background border border-border rounded-xl shadow-sm">
            <div className="flex-1 p-3">
              <textarea
                ref={textareaRef}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Message Sequb..."
                disabled={isLoading}
                rows={1}
                maxLength={maxMessageLength}
                className="w-full resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 max-h-[200px] overflow-y-auto"
                style={{ minHeight: '20px' }}
              />
            </div>
            <div className="p-2">
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading}
                size="sm"
                className="rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Sequb can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}