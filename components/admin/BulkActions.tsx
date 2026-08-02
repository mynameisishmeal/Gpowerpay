'use client';

import { CheckCircle, XCircle, Star, StarOff, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsProps {
  selectedCount: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onFeature?: () => void;
  onUnfeature?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

/**
 * Admin BulkActions Component
 * Shows action bar when items are selected
 */
export function BulkActions({
  selectedCount,
  onActivate,
  onDeactivate,
  onFeature,
  onUnfeature,
  onDelete,
  onCancel,
  customActions = [],
}: BulkActionsProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-blue-900">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </p>
          
          <div className="flex items-center gap-2">
            {onActivate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onActivate}
                className="bg-white hover:bg-gray-50"
              >
                <CheckCircle size={16} className="mr-2 text-green-600" />
                Activate
              </Button>
            )}

            {onDeactivate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDeactivate}
                className="bg-white hover:bg-gray-50"
              >
                <XCircle size={16} className="mr-2 text-gray-600" />
                Deactivate
              </Button>
            )}

            {onFeature && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFeature}
                className="bg-white hover:bg-gray-50"
              >
                <Star size={16} className="mr-2 text-yellow-600" />
                Feature
              </Button>
            )}

            {onUnfeature && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUnfeature}
                className="bg-white hover:bg-gray-50"
              >
                <StarOff size={16} className="mr-2 text-gray-600" />
                Unfeature
              </Button>
            )}

            {customActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className="bg-white hover:bg-gray-50"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            ))}

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            <X size={16} className="mr-1" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
