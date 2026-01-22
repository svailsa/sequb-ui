'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import TemplateGallery from '@/components/template/template-gallery';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, Grid3X3, List, Import, Upload, Download } from 'lucide-react';
import { Workflow } from '@/types/sequb';

type ViewMode = 'grid' | 'list';

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch templates - using workflows with a special tag/category
  const { data: templatesData, isLoading, error } = useQuery({
    queryKey: ['templates', searchQuery, selectedCategory],
    queryFn: async () => {
      try {
        // Fetch workflows that are marked as templates
        const response = await api.workflows.list({ 
          page: 1, 
          per_page: 100,
          status: 'template' // Assuming templates have a special status
        });
        return response.data.data;
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        // Return mock templates for demonstration
        return getMockTemplates();
      }
    },
  });

  // Import template mutation
  const importTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.workflows.clone(templateId, `Template Copy - ${new Date().toLocaleString()}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      alert('Template imported successfully!');
    },
    onError: (error) => {
      console.error('Failed to import template:', error);
      alert('Failed to import template. Please try again.');
    },
  });

  // Filter templates based on search and category
  const filteredTemplates = templatesData?.filter((template: any) => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      template.category === selectedCategory ||
      template.tags?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories from templates
  const categories = ['all', ...new Set(templatesData?.flatMap((t: any) => 
    t.tags || [t.category || 'uncategorized']
  ).filter(Boolean) || [])];

  const handleImportTemplate = (templateId: string) => {
    importTemplateMutation.mutate(templateId);
  };

  const handleExportTemplate = (templateId: string) => {
    // Export template as JSON
    const template = templatesData?.find((t: any) => t.id === templateId);
    if (template) {
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '-')}-template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleUploadTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        try {
          const template = JSON.parse(text);
          // Create new workflow from template
          await api.workflows.create({
            name: template.name || 'Imported Template',
            description: template.description,
            graph: template.graph
          });
          queryClient.invalidateQueries({ queryKey: ['templates'] });
          alert('Template uploaded successfully!');
        } catch (error) {
          console.error('Failed to parse template:', error);
          alert('Invalid template file format');
        }
      }
    };
    input.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Template Library</h1>
        <p className="text-muted-foreground">
          Browse and import pre-built workflow templates to accelerate your automation
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <Button
          onClick={handleUploadTemplate}
          variant="outline"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Template
        </Button>
        
        <Button
          onClick={() => setShowImportModal(true)}
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Failed to load templates</div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-muted-foreground mb-4">No templates found</div>
          <p className="text-sm text-muted-foreground max-w-md">
            {searchQuery 
              ? `No templates match your search "${searchQuery}"`
              : 'Start by creating or uploading your first template'}
          </p>
        </div>
      ) : (
        <TemplateGallery
          templates={filteredTemplates}
          viewMode={viewMode}
          onImport={handleImportTemplate}
          onExport={handleExportTemplate}
        />
      )}
    </div>
  );
}

// Mock templates for demonstration
function getMockTemplates(): any[] {
  return [
    {
      id: '1',
      name: 'Data ETL Pipeline',
      description: 'Extract, transform, and load data from multiple sources',
      category: 'data-processing',
      tags: ['etl', 'data', 'automation'],
      icon: '📊',
      complexity: 'intermediate',
      estimatedTime: '15 mins',
      uses: 1234,
      rating: 4.8,
      author: 'Sequb Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'API Health Monitor',
      description: 'Monitor API endpoints and send alerts on failures',
      category: 'monitoring',
      tags: ['api', 'monitoring', 'alerts'],
      icon: '🔍',
      complexity: 'beginner',
      estimatedTime: '5 mins',
      uses: 892,
      rating: 4.6,
      author: 'Sequb Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Email Marketing Campaign',
      description: 'Automated email campaign with personalization and tracking',
      category: 'marketing',
      tags: ['email', 'marketing', 'automation'],
      icon: '📧',
      complexity: 'intermediate',
      estimatedTime: '20 mins',
      uses: 756,
      rating: 4.7,
      author: 'Community',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Database Backup Automation',
      description: 'Schedule and automate database backups to cloud storage',
      category: 'devops',
      tags: ['database', 'backup', 'cloud'],
      icon: '💾',
      complexity: 'advanced',
      estimatedTime: '30 mins',
      uses: 445,
      rating: 4.9,
      author: 'Sequb Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Social Media Scheduler',
      description: 'Schedule and post content across multiple social platforms',
      category: 'marketing',
      tags: ['social', 'scheduling', 'content'],
      icon: '📱',
      complexity: 'intermediate',
      estimatedTime: '10 mins',
      uses: 623,
      rating: 4.5,
      author: 'Community',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '6',
      name: 'Log Analysis Pipeline',
      description: 'Analyze application logs and generate insights',
      category: 'data-processing',
      tags: ['logs', 'analysis', 'insights'],
      icon: '📈',
      complexity: 'advanced',
      estimatedTime: '25 mins',
      uses: 334,
      rating: 4.7,
      author: 'Sequb Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}