'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Info,
  FileCode,
  Package
} from 'lucide-react';
import { sanitizeFileName, sanitizeInput } from '@/lib/utils/sanitizer';

interface PluginUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
  isValid: boolean;
  error?: string;
}

export default function PluginUpload({ onSuccess, onCancel }: PluginUploadProps) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [metadata, setMetadata] = useState({
    name: '',
    version: '',
    description: '',
    author: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!fileInfo?.file) {
        throw new Error('No file selected');
      }

      // Validate metadata
      if (!metadata.name || !metadata.version) {
        throw new Error('Plugin name and version are required');
      }

      // Create form data with file and metadata
      const formData = new FormData();
      formData.append('file', fileInfo.file);
      Object.entries(metadata).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const response = await api.plugins.upload(fileInfo.file);
      return response.data;
    },
    onSuccess: () => {
      alert('Plugin uploaded successfully!');
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Upload failed:', error);
      alert(`Failed to upload plugin: ${error.message}`);
    },
  });

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const validExtensions = ['.wasm', '.js', '.py', '.zip'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    // Sanitize filename first
    const sanitizedName = sanitizeFileName(file.name);
    if (sanitizedName !== file.name) {
      return {
        isValid: false,
        error: 'File name contains invalid characters'
      };
    }

    // Check file extension
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(extension)) {
      return { 
        isValid: false, 
        error: `Invalid file type. Supported: ${validExtensions.join(', ')}` 
      };
    }
    
    // Check file size
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `File size exceeds 10MB limit` 
      };
    }
    
    // Check for empty files
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty'
      };
    }
    
    // Check for path traversal attempts
    if (file.name.includes('../') || file.name.includes('..\\')) {
      return {
        isValid: false,
        error: 'Invalid file name: path traversal detected'
      };
    }
    
    // Check for suspicious patterns in filename
    const suspiciousPatterns = [
      /^\./, // Hidden files
      /\0/, // Null bytes
      /<script/i, // Script tags
      /javascript:/i, // JavaScript protocol
      /on\w+=/i, // Event handlers
      /\.(exe|bat|cmd|sh|ps1|vbs)$/i // Executable extensions
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        return {
          isValid: false,
          error: 'File name contains suspicious patterns'
        };
      }
    }
    
    // Additional MIME type validation
    const validMimeTypes = [
      'application/wasm',
      'application/javascript',
      'text/javascript',
      'application/x-javascript',
      'text/x-python',
      'application/x-python-code',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream' // Generic binary
    ];
    
    if (file.type && !validMimeTypes.includes(file.type)) {
      console.warn(`Suspicious MIME type: ${file.type} for file: ${file.name}`);
      // Don't reject based on MIME type alone as it can be spoofed
    }
    
    return { isValid: true };
  };

  const handleFile = (file: File) => {
    const validation = validateFile(file);
    
    setFileInfo({
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      isValid: validation.isValid,
      error: validation.error,
    });

    // Try to extract metadata from filename
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
    const parts = nameWithoutExt.split('-');
    
    if (parts.length >= 2) {
      const version = parts[parts.length - 1];
      const name = parts.slice(0, -1).join('-');
      
      if (/^\d+\.\d+\.\d+$/.test(version)) {
        setMetadata(prev => ({
          ...prev,
          name: prev.name || name,
          version: prev.version || version,
        }));
      } else {
        setMetadata(prev => ({
          ...prev,
          name: prev.name || nameWithoutExt,
        }));
      }
    } else {
      setMetadata(prev => ({
        ...prev,
        name: prev.name || nameWithoutExt,
      }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upload Plugin</CardTitle>
            <CardDescription>
              Upload a WebAssembly, JavaScript, or Python plugin
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : fileInfo?.isValid 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : fileInfo?.error
                  ? 'border-destructive bg-destructive/5'
                  : 'border-muted-foreground/25'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".wasm,.js,.py,.zip"
            onChange={handleFileSelect}
            className="hidden"
          />

          {fileInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                {fileInfo.isValid ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-destructive" />
                )}
              </div>
              
              <div className="space-y-1">
                <p className="font-medium">{fileInfo.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(fileInfo.size)}
                </p>
                {fileInfo.error && (
                  <p className="text-sm text-destructive">{fileInfo.error}</p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Different File
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              
              <div className="space-y-1">
                <p className="font-medium">Drop your plugin file here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>
          )}
        </div>

        {/* Supported Formats Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>WebAssembly (.wasm) - High-performance compiled plugins</li>
              <li>JavaScript (.js) - Dynamic scripting plugins</li>
              <li>Python (.py) - Python-based plugins</li>
              <li>ZIP Archive (.zip) - Multi-file plugins with manifest</li>
            </ul>
          </div>
        </div>

        {/* Metadata Form */}
        {fileInfo?.isValid && (
          <div className="space-y-4">
            <h3 className="font-medium">Plugin Metadata</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Plugin Name *</Label>
                <Input
                  id="name"
                  placeholder="my-awesome-plugin"
                  value={metadata.name}
                  onChange={(e) => setMetadata(prev => ({ ...prev, name: sanitizeInput(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  placeholder="1.0.0"
                  value={metadata.version}
                  onChange={(e) => setMetadata(prev => ({ ...prev, version: sanitizeInput(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Your name or organization"
                value={metadata.author}
                onChange={(e) => setMetadata(prev => ({ ...prev, author: sanitizeInput(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what your plugin does..."
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: sanitizeInput(e.target.value) }))}
                rows={3}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleUpload}
          disabled={!fileInfo?.isValid || !metadata.name || !metadata.version || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Package className="h-4 w-4 mr-2" />
              Upload Plugin
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}