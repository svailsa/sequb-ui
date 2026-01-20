"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Workflow, 
  Play, 
  Settings, 
  Plus,
  History,
  Folder,
  ChevronDown,
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNodeRegistryStore } from "@/stores/node-registry-store";

const mainSidebarItems = [
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
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("/");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const { categories, nodeTypes, isLoading, loadRegistry, getNodesByCategory } = useNodeRegistryStore();

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="font-semibold">Sequb</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Main Navigation */}
        <div className="space-y-2">
          {mainSidebarItems.map((item) => (
            <Button
              key={item.href}
              variant={activeItem === item.href ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveItem(item.href);
                router.push(item.href as any);
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Node Types Section */}
        <div className="space-y-1">
          <div className="px-2 py-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Node Types
              {isLoading && <Loader2 className="inline-block w-3 h-3 ml-2 animate-spin" />}
            </h3>
          </div>
          
          {categories.length === 0 && !isLoading ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">
              No node types available
            </div>
          ) : (
            categories.map((category) => {
              const categoryNodes = getNodesByCategory(category);
              const isExpanded = expandedCategories.has(category);
              
              return (
                <div key={category} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-xs px-2 py-1 h-auto"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronRight className="w-3 h-3 mr-1" />
                      )}
                      {category}
                    </span>
                    <span className="text-muted-foreground">
                      {categoryNodes.length}
                    </span>
                  </Button>
                  
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {categoryNodes.map((node) => (
                        <div
                          key={node.id}
                          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded"
                          title={node.description}
                        >
                          {node.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Version 0.1.0
          {nodeTypes.length > 0 && (
            <div className="mt-1">
              {nodeTypes.length} node types loaded
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}