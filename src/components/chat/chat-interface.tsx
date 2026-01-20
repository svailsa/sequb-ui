"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/sequb";

// Mock initial message
const initialMessage: ChatMessage = {
  id: "1",
  role: "assistant",
  content: "Hello! I'm your Sequb AI assistant. I can help you create and manage workflows using natural language. Try asking me something like:\n\n• \"Create a workflow that sends me a daily weather report\"\n• \"Set up an automation to backup my photos weekly\"\n• \"Build a workflow that summarizes my emails\"\n\nWhat would you like to build today?",
  timestamp: new Date().toISOString(),
};

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you want to: "${inputValue}". Let me help you create a workflow for that.\n\nI'm working on setting up the backend integration. For now, this is a placeholder response. Soon I'll be able to:\n\n• Analyze your request\n• Suggest appropriate workflow nodes\n• Create and execute workflows\n• Monitor execution progress\n\nStay tuned for full functionality!`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start space-x-3",
              message.role === "user" && "flex-row-reverse space-x-reverse"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              message.role === "assistant" 
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {message.role === "assistant" ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            {/* Message content */}
            <div className={cn(
              "flex-1 max-w-3xl",
              message.role === "user" && "flex justify-end"
            )}>
              <div className={cn(
                "px-4 py-3 rounded-lg",
                message.role === "assistant"
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              )}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                <div className={cn(
                  "text-xs mt-2 opacity-70",
                  message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground"
                )}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-6">
        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the workflow you want to create..."
              disabled={isLoading}
              className="min-h-[44px] py-3"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center mt-3">
          Powered by Sequb Protocol • Your data is processed securely
        </div>
      </div>
    </div>
  );
}