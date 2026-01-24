'use client';

import { useState } from 'react';
import { Message, MessagePriority } from '@/types/sequb';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Bell, Bug, HelpCircle, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageDialogProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string, approved: boolean, notes?: string) => void;
}

const priorityColors: Record<MessagePriority, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  normal: 'bg-blue-500 text-white',
  low: 'bg-gray-500 text-white',
};

const categoryIcons = {
  human_approval: HelpCircle,
  system_alert: AlertTriangle,
  workflow_error: Bug,
  support_ticket: HelpCircle,
};

export function MessageDialog({
  message,
  isOpen,
  onClose,
  onMarkAsRead,
  onArchive,
  onDelete,
  onApprove
}: MessageDialogProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  
  if (!message) return null;

  const CategoryIcon = categoryIcons[message.category.type];
  
  const isApprovalMessage = message.category.type === 'human_approval';
  const isPendingApproval = isApprovalMessage && 
    'context' in message.category && 
    message.category.context.status === 'pending';

  const handleApprove = (approved: boolean) => {
    if (onApprove) {
      onApprove(message.id, approved, approvalNotes || undefined);
      setApprovalNotes('');
      onClose();
    }
  };

  const renderCategoryDetails = () => {
    switch (message.category.type) {
      case 'human_approval':
        if ('context' in message.category) {
          return (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Approval Question</h4>
                <p className="text-sm text-muted-foreground">{message.category.context.question}</p>
              </div>
              
              {message.category.context.details && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Details</h4>
                  <p className="text-sm text-muted-foreground">{message.category.context.details}</p>
                </div>
              )}
              
              {message.category.context.options.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Options</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {message.category.context.options.map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {message.category.context.response && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Response</h4>
                  <p className="text-sm">
                    <Badge 
                      className={message.category.context.response.approved ? 'bg-green-500' : 'bg-red-500'}
                    >
                      {message.category.context.response.approved ? 'Approved' : 'Rejected'}
                    </Badge>
                  </p>
                  {message.category.context.response.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {message.category.context.response.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        }
        break;
        
      case 'workflow_error':
        if ('error_code' in message.category) {
          return (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Error Code: </span>
                <code className="text-sm bg-muted px-1 rounded">{message.category.error_code}</code>
              </div>
              {message.category.error_details && (
                <div>
                  <span className="text-sm font-medium">Details: </span>
                  <span className="text-sm text-muted-foreground">{message.category.error_details}</span>
                </div>
              )}
              <div>
                <span className="text-sm font-medium">Workflow: </span>
                <span className="text-sm text-muted-foreground">{message.category.workflow_id}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Execution: </span>
                <span className="text-sm text-muted-foreground">{message.category.execution_id}</span>
              </div>
            </div>
          );
        }
        break;
        
      case 'system_alert':
        if ('alert_type' in message.category) {
          return (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Alert Type: </span>
                <Badge variant="outline">{message.category.alert_type}</Badge>
              </div>
              <div>
                <span className="text-sm font-medium">Severity: </span>
                <Badge 
                  className={
                    message.category.severity === 'critical' ? 'bg-red-500' :
                    message.category.severity === 'high' ? 'bg-orange-500' :
                    message.category.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }
                >
                  {message.category.severity}
                </Badge>
              </div>
            </div>
          );
        }
        break;
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <CategoryIcon className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>{message.title}</DialogTitle>
            <Badge className={priorityColors[message.priority]} variant="secondary">
              {message.priority}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message details */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(message.created_at))} ago</span>
            </span>
            <Badge variant="outline">{message.status}</Badge>
            {message.expires_at && (
              <span className="text-red-600">
                Expires {formatDistanceToNow(new Date(message.expires_at))} from now
              </span>
            )}
          </div>

          <Separator />

          {/* Message body */}
          <div>
            <h4 className="text-sm font-medium mb-2">Message</h4>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
            </div>
          </div>

          {/* Category-specific details */}
          {renderCategoryDetails() && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Details</h4>
                {renderCategoryDetails()}
              </div>
            </>
          )}

          {/* Approval section */}
          {isPendingApproval && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Approval Response</h4>
                <Textarea
                  placeholder="Add notes (optional)..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleApprove(false)}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(true)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex justify-between">
            <div className="flex space-x-2">
              {message.status === 'unread' && onMarkAsRead && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    onMarkAsRead(message.id);
                    onClose();
                  }}
                >
                  Mark as Read
                </Button>
              )}
              {message.status !== 'archived' && onArchive && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    onArchive(message.id);
                    onClose();
                  }}
                >
                  Archive
                </Button>
              )}
            </div>
            
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(message.id);
                  onClose();
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}