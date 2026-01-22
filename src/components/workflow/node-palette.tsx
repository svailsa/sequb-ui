"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useNodeRegistryStore } from '@/stores/node-registry-store';
import { NodeType } from '@/types/sequb';

export function NodePalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Input', 'AI']));
  
  const { categories, isLoading, loadRegistry, getNodesByCategory } = useNodeRegistryStore();

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

  const onDragStart = (event: React.DragEvent, nodeTypeId: string) => {
    event.dataTransfer.setData('application/reactflow', nodeTypeId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getFilteredNodes = (category: string): NodeType[] => {
    const categoryNodes = getNodesByCategory(category);
    if (!searchTerm) return categoryNodes;
    
    return categoryNodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getNodeIcon = (nodeType: NodeType): string => {
    // Map node types to icons
    const iconMap: Record<string, string> = {
      'text_input': '📝',
      'http_request': '🌐',
      'email_send': '✉️',
      'ai_completion': '🧠',
      'file_write': '📄',
      'delay': '⏰',
    };
    
    return iconMap[nodeType.id] || '⚙️';
  };

  const filteredCategories = categories.filter(category => {
    const nodes = getFilteredNodes(category);
    return nodes.length > 0;
  });

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center space-x-2 mb-3">
          <h3 className="font-semibold text-sm">Node Palette</h3>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredCategories.length === 0 ? (
          <div className="p-3 text-center text-sm text-muted-foreground">
            {isLoading ? 'Loading nodes...' : searchTerm ? 'No matching nodes' : 'No nodes available'}
          </div>
        ) : (
          filteredCategories.map((category) => {
            const categoryNodes = getFilteredNodes(category);
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
                  <div className="space-y-1">
                    {categoryNodes.map((nodeType) => (
                      <div
                        key={nodeType.id}
                        className="p-2 border border-border rounded-lg cursor-move hover:bg-muted transition-colors bg-background"
                        draggable
                        onDragStart={(event) => onDragStart(event, nodeType.id)}
                        title={nodeType.description}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="text-lg leading-none">
                            {getNodeIcon(nodeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium leading-tight">
                              {nodeType.name}
                            </div>
                            {nodeType.description && (
                              <div className="text-xs text-muted-foreground leading-tight mt-1 line-clamp-2">
                                {nodeType.description}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>{nodeType.inputs.length} inputs</span>
                              <span>{nodeType.outputs.length} outputs</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Drag nodes to the canvas to build your workflow
        </div>
      </div>
    </div>
  );
}