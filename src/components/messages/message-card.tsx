'use client';

import { Message, MessagePriority, MessageStatus } from '@/types/sequb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bell, Bug, HelpCircle, Clock, CheckCircle, Archive, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageCardProps {
  message: Message;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string, approved: boolean, notes?: string) => void;
  onClick?: (message: Message) => void;
}

const priorityColors: Record<MessagePriority, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  normal: 'bg-blue-500 text-white',
  low: 'bg-gray-500 text-white',
};

const statusColors: Record<MessageStatus, string> = {
  unread: 'bg-blue-100 text-blue-800',
  read: 'bg-gray-100 text-gray-800',
  archived: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
};

const categoryIcons = {
  human_approval: HelpCircle,
  system_alert: AlertTriangle,
  workflow_error: Bug,
  support_ticket: HelpCircle,
};

export function MessageCard({ 
  message, 
  onMarkAsRead, 
  onArchive, 
  onDelete, 
  onApprove,
  onClick 
}: MessageCardProps) {
  const CategoryIcon = categoryIcons[message.category.type];
  
  const isApprovalMessage = message.category.type === 'human_approval';
  const isPendingApproval = isApprovalMessage && 
    'context' in message.category && 
    message.category.context.status === 'pending';

  const handleCardClick = () => {
    if (onClick) {
      onClick(message);
    }
    
    // Auto-mark as read when clicked
    if (message.status === 'unread' && onMarkAsRead) {
      onMarkAsRead(message.id);
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        message.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{message.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={priorityColors[message.priority]} variant="secondary">
              {message.priority}
            </Badge>
            <Badge className={statusColors[message.status]} variant="outline">
              {message.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {message.body}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(message.created_at))} ago</span>
            </span>
            {message.expires_at && (
              <span className="text-red-600">
                Expires {formatDistanceToNow(new Date(message.expires_at))} from now
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {isPendingApproval && onApprove && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(message.id, false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(message.id, true);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
            
            {message.status === 'unread' && onMarkAsRead && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(message.id);
                }}
              >
                <CheckCircle className="h-3 w-3" />
              </Button>
            )}
            
            {message.status !== 'archived' && onArchive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(message.id);
                }}
              >
                <Archive className="h-3 w-3" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(message.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}