'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message, InboxFilter } from '@/types/sequb';
import { MessageList, MessageDialog } from '@/components/messages';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function MessagesPage() {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inbox
  const { data: inboxData, isLoading } = useQuery({
    queryKey: ['inbox', filter],
    queryFn: () => api.inbox.get({ filter }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const inbox = inboxData?.data;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => 
      api.messages.update(messageId, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast({
        title: "Message marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive",
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (messageId: string) => 
      api.messages.update(messageId, { archive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast({
        title: "Message archived",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => api.messages.delete(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast({
        title: "Message deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ messageId, approved, notes }: { 
      messageId: string; 
      approved: boolean; 
      notes?: string 
    }) => 
      api.messages.approve(messageId, { approved, notes }),
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast({
        title: approved ? "Request approved" : "Request rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      });
    },
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedMessage(null);
    setIsDialogOpen(false);
  };

  const handleMarkAsRead = (messageId: string) => {
    markAsReadMutation.mutate(messageId);
  };

  const handleArchive = (messageId: string) => {
    archiveMutation.mutate(messageId);
  };

  const handleDelete = (messageId: string) => {
    deleteMutation.mutate(messageId);
  };

  const handleApprove = (messageId: string, approved: boolean, notes?: string) => {
    approveMutation.mutate({ messageId, approved, notes });
  };

  if (!inbox) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <MessageList
        messages={inbox.data.messages}
        unreadCount={inbox.data.unread_count}
        totalCount={inbox.data.total_count}
        currentFilter={filter}
        onFilterChange={setFilter}
        onMarkAsRead={handleMarkAsRead}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onMessageClick={handleMessageClick}
        isLoading={isLoading}
      />

      <MessageDialog
        message={selectedMessage}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onMarkAsRead={handleMarkAsRead}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onApprove={handleApprove}
      />
    </div>
  );
}