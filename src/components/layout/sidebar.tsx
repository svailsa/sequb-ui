"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Workflow, 
  Play, 
  Settings, 
  Plus,
  History,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    label: "New Chat",
    icon: Plus,
    href: "/",
    primary: true,
  },
  {
    label: "Chat History",
    icon: History,
    href: "/history",
  },
  {
    label: "Workflows",
    icon: Workflow,
    href: "/workflows",
  },
  {
    label: "Executions",
    icon: Play,
    href: "/executions",
  },
  {
    label: "Templates",
    icon: Folder,
    href: "/templates",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("/");

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="font-semibold">Sequb UI</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
          <Button
            key={item.href}
            variant={activeItem === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              item.primary && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => setActiveItem(item.href)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Version 0.1.0
        </div>
      </div>
    </aside>
  );
}