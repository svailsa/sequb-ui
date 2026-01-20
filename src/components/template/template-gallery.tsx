import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Import, Star, Clock, Users, Code, MoreVertical } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  icon?: string;
  complexity?: string;
  estimatedTime?: string;
  uses?: number;
  rating?: number;
  author?: string;
  created_at: string;
  updated_at: string;
}

interface TemplateGalleryProps {
  templates: Template[];
  viewMode: 'grid' | 'list';
  onImport: (templateId: string) => void;
  onExport: (templateId: string) => void;
}

export default function TemplateGallery({
  templates,
  viewMode,
  onImport,
  onExport,
}: TemplateGalleryProps) {
  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'beginner':
        return 'text-green-600 bg-green-100';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100';
      case 'advanced':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-start gap-4">
                {template.icon && (
                  <div className="text-3xl">{template.icon}</div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    {template.complexity && (
                      <span className={`px-2 py-1 rounded-full ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </span>
                    )}
                    {template.estimatedTime && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {template.estimatedTime}
                      </span>
                    )}
                    {template.uses && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {template.uses} uses
                      </span>
                    )}
                    {template.rating && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-3 w-3 fill-current" />
                        {template.rating}
                      </span>
                    )}
                    {template.author && (
                      <span className="text-muted-foreground">
                        by {template.author}
                      </span>
                    )}
                  </div>
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onImport(template.id)}
                  size="sm"
                >
                  <Import className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
                <Button
                  onClick={() => onExport(template.id)}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {template.icon && (
                  <div className="text-2xl">{template.icon}</div>
                )}
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {template.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {template.complexity && (
                <span className={`px-2 py-1 text-xs rounded-full ${getComplexityColor(template.complexity)}`}>
                  {template.complexity}
                </span>
              )}
              {template.estimatedTime && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {template.estimatedTime}
                </span>
              )}
            </div>

            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs text-muted-foreground">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {template.uses && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {template.uses}
                </span>
              )}
              {template.rating && (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-3 w-3 fill-current" />
                  {template.rating}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onExport(template.id)}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onImport(template.id)}
                size="sm"
              >
                <Import className="h-4 w-4 mr-1" />
                Use
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}