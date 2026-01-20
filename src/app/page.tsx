import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          }>
            <ChatInterface />
          </Suspense>
        </main>
      </div>
    </div>
  );
}