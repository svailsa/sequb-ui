'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ApprovalRequest as BaseApprovalRequest } from '@/types/sequb';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  FileText,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface ApprovalRequestExtended {
  id: string;
  execution_id: string;
  node_id?: string;
  workflow_id: string;
  workflow_name: string;
  requester: string;
  title: string;
  message?: string;
  data?: any;
  description?: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  responded_at?: string;
  responder?: string;
  responder_id?: string;
  response_notes?: string;
  notes?: string;
}

export default function ApprovalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequestExtended | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch approvals
  const { data: approvalsData, isLoading, refetch } = useQuery({
    queryKey: ['approvals', filterStatus],
    queryFn: async () => {
      try {
        const params = filterStatus !== 'all' ? { status: filterStatus } : undefined;
        const response = await api.approvals.list(params);
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch approvals:', error);
        // Return mock data for demonstration
        return getMockApprovals();
      }
    },
  });

  // Respond to approval mutation
  const respondMutation = useMutation({
    mutationFn: async ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) => {
      const response = await api.approvals.respond(id, approved, notes);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      setSelectedApproval(null);
      setResponseNotes('');
      alert('Response submitted successfully!');
    },
    onError: (error) => {
      console.error('Failed to respond to approval:', error);
      alert('Failed to submit response. Please try again.');
    },
  });

  // Filter approvals
  const filteredApprovals = (approvalsData as ApprovalRequestExtended[] | undefined)?.filter((approval) => {
    const matchesSearch = !searchQuery || 
      approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.workflow_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const handleRespond = (approved: boolean) => {
    if (!selectedApproval) return;
    
    respondMutation.mutate({
      id: selectedApproval.id,
      approved,
      notes: responseNotes,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Approval Requests</h1>
        <p className="text-muted-foreground">
          Review and respond to workflow approval requests
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {['pending', 'approved', 'rejected', 'all'].map((status) => {
          const count = status === 'all' 
            ? approvalsData?.length || 0
            : (approvalsData as ApprovalRequestExtended[] | undefined)?.filter((a) => a.status === status).length || 0;
          
          return (
            <Card 
              key={status}
              className={`cursor-pointer transition-colors ${
                filterStatus === status ? 'border-primary' : ''
              }`}
              onClick={() => setFilterStatus(status)}
            >
              <CardHeader className="pb-2">
                <CardDescription className="capitalize">{status}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search approvals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Approvals List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading approvals...</div>
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-muted-foreground mb-2">No approval requests found</div>
          <p className="text-sm text-muted-foreground max-w-md">
            {searchQuery 
              ? `No approvals match your search "${searchQuery}"`
              : filterStatus === 'pending'
                ? 'No pending approval requests at this time'
                : `No ${filterStatus} approval requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <Card key={approval.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(approval.status)}
                      <CardTitle className="text-lg">{approval.title}</CardTitle>
                    </div>
                    <CardDescription>{approval.description}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(approval.status)}`}>
                    {approval.status}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Workflow:</span>
                    <span className="font-medium">{approval.workflow_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Requester:</span>
                    <span className="font-medium">{approval.requester}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{formatDate(approval.created_at)}</span>
                  </div>
                </div>

                {approval.status !== 'pending' && approval.responder && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Responded by {approval.responder}</span>
                      {approval.responded_at && (
                        <span className="text-muted-foreground">
                          {formatDate(approval.responded_at)}
                        </span>
                      )}
                    </div>
                    {approval.response_notes && (
                      <p className="text-sm">{approval.response_notes}</p>
                    )}
                  </div>
                )}

                {approval.metadata && Object.keys(approval.metadata).length > 0 && (
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium">Additional Details</summary>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(approval.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
              
              {approval.status === 'pending' && (
                <CardFooter>
                  <Button
                    onClick={() => setSelectedApproval(approval)}
                    className="w-full"
                  >
                    Review & Respond
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Respond to Approval Request</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedApproval(null);
                    setResponseNotes('');
                  }}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Request Title</Label>
                <p className="font-medium">{selectedApproval.title}</p>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedApproval.description || 'No description provided'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Workflow</Label>
                <p className="text-sm">{selectedApproval.workflow_name}</p>
              </div>

              <div className="space-y-2">
                <Label>Requested By</Label>
                <p className="text-sm">{selectedApproval.requester}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Response Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or comments about your decision..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => handleRespond(false)}
                disabled={respondMutation.isPending}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleRespond(true)}
                disabled={respondMutation.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Mock approvals for demonstration
function getMockApprovals(): ApprovalRequestExtended[] {
  return [
    {
      id: '1',
      workflow_id: 'wf-1',
      workflow_name: 'Production Deployment',
      execution_id: 'exec-1',
      requester: 'john.doe@example.com',
      status: 'pending',
      title: 'Deploy v2.1.0 to production',
      description: 'Requesting approval to deploy version 2.1.0 to production environment',
      metadata: {
        version: '2.1.0',
        environment: 'production',
        changes: ['Bug fixes', 'Performance improvements', 'New API endpoints'],
      },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      workflow_id: 'wf-2',
      workflow_name: 'Database Migration',
      execution_id: 'exec-2',
      requester: 'jane.smith@example.com',
      status: 'approved',
      title: 'Migrate customer data to new schema',
      description: 'Approval needed for customer database migration',
      metadata: {
        records_affected: 15000,
        estimated_time: '2 hours',
        rollback_plan: 'Available',
      },
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      responded_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      responder: 'admin@example.com',
      response_notes: 'Approved. Please proceed during maintenance window.',
    },
    {
      id: '3',
      workflow_id: 'wf-3',
      workflow_name: 'Budget Allocation',
      execution_id: 'exec-3',
      requester: 'finance@example.com',
      status: 'pending',
      title: 'Q4 Marketing Budget Increase',
      description: 'Requesting approval for additional $50,000 marketing budget',
      metadata: {
        amount: 50000,
        currency: 'USD',
        department: 'Marketing',
        quarter: 'Q4',
      },
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];
}