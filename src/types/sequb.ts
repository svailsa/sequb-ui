// Core types matching sequb-protocol backend

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