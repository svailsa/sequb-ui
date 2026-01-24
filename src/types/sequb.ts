// Core types matching sequb-protocol backend

// Message system types
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';
export type MessageStatus = 'unread' | 'read' | 'archived' | 'resolved' | 'expired';
export type MessageCategoryType = 'human_approval' | 'system_alert' | 'workflow_error' | 'support_ticket';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface MessageId {
  id: string;
}

export interface ApprovalContext {
  question: string;
  details?: string;
  options: string[];
  required_approvers: string[];
  status: ApprovalStatus;
  response?: ApprovalResponse;
}

export interface ApprovalResponse {
  approved: boolean;
  notes?: string;
  responded_at: string;
  responder_id: string;
}

export type MessageCategory = 
  | {
      type: 'human_approval';
      workflow_id: string;
      execution_id: string;
      node_id: string;
      timeout?: string;
      context: ApprovalContext;
    }
  | {
      type: 'system_alert';
      alert_type: string;
      severity: string;
    }
  | {
      type: 'workflow_error';
      workflow_id: string;
      execution_id: string;
      error_code: string;
      error_details?: string;
    }
  | {
      type: 'support_ticket';
      ticket_id: string;
      status: TicketStatus;
    };

export interface Message {
  id: string;
  user_id: string;
  category: MessageCategory;
  title: string;
  body: string;
  priority: MessagePriority;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  read_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface Inbox {
  user_id: string;
  messages: Message[];
  unread_count: number;
  total_count: number;
  has_priority_messages?: boolean;
  last_sync?: string;
}

export type InboxFilter = 'all' | 'unread' | 'priority' | 'category';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: MessagePriority;
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachments: string[];
  created_at: string;
}

export interface CreateMessageRequest {
  user_id: string;
  category: MessageCategory;
  title: string;
  body: string;
  priority: MessagePriority;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMessageRequest {
  status?: MessageStatus;
  read?: boolean;
  archive?: boolean;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  priority: MessagePriority;
  tags: string[];
}

export interface MessageApprovalRequest {
  approved: boolean;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'archived';
  version: number;
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
  graph?: WorkflowGraph;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  label?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Execution {
  id: string;
  workflow_id: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  cost?: number;
  metadata?: Record<string, any>;
}

export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'waiting_for_approval';

export interface ExecutionLog {
  id: string;
  execution_id: string;
  node_id?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NodeType {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  examples?: NodeExample[];
}

export interface NodeInput {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'file' | 'code' | 'json';
  required: boolean;
  default?: any;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface NodeOutput {
  key: string;
  label: string;
  type: string;
  description?: string;
}

export interface NodeExample {
  name: string;
  description?: string;
  inputs: Record<string, any>;
}

export interface Registry {
  categories: string[];
  node_types: Record<string, NodeType>;
  version: string;
  updated_at: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  status: 'active' | 'inactive' | 'error';
  node_types: string[];
  created_at: string;
  updated_at: string;
}

export interface WebhookConfig {
  id: string;
  workflow_id: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  execution_id: string;
  node_id: string;
  message: string;
  data: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  responded_at?: string;
  responder_id?: string;
  notes?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// Chat interface types
export interface ChatMessage {
  id: string;
  session_id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    workflow_id?: string;
    execution_id?: string;
    action?: 'create_workflow' | 'execute_workflow' | 'explain' | 'error';
  };
}

export interface ChatSession {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}