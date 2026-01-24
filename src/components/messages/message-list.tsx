'use client';

import { useState } from 'react';
import { Message, InboxFilter } from '@/types/sequb';
import { MessageCard } from './message-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  unreadCount: number;
  totalCount: number;
  currentFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string, approved: boolean, notes?: string) => void;
  onMessageClick?: (message: Message) => void;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  unreadCount,
  totalCount,
  currentFilter,
  onFilterChange,
  onMarkAsRead,
  onArchive,
  onDelete,
  onApprove,
  onMessageClick,
  isLoading = false
}: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = messages.filter(message => {
    if (!searchQuery) return true;
    return message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           message.body.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filterOptions = [
    { value: 'all' as const, label: 'All Messages', count: totalCount },
    { value: 'unread' as const, label: 'Unread', count: unreadCount },
    { value: 'priority' as const, label: 'High Priority', count: messages.filter(m => m.priority === 'high' || m.priority === 'critical').length },
    { value: 'category' as const, label: 'By Category', count: null }
  ];

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Messages</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          
          {/* Filter */}
          <Select value={currentFilter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.count !== null && (
                      <Badge variant="secondary" className="ml-2">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No messages match your search.' : 'No messages found.'}
          </div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onMarkAsRead={onMarkAsRead}
                onArchive={onArchive}
                onDelete={onDelete}
                onApprove={onApprove}
                onClick={onMessageClick}
              />
            ))}
            
            {filteredMessages.length < totalCount && (
              <div className="text-center py-4">
                <Button variant="outline">Load More</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}