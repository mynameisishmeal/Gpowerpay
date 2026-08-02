import { useState } from 'react';
import { ICategory } from '@/types';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Folder,
  FolderOpen,
} from 'lucide-react';

interface CategoryTreeProps {
  categories: ICategory[];
  onEdit: (category: ICategory) => void;
  onDelete: (category: ICategory) => void;
  onAddChild: (parentId: string) => void;
  level?: number;
}

/**
 * CategoryTree Component
 * Recursive tree view for categories with drag-and-drop support
 */
export function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onAddChild,
  level = 0,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getCategoryChildren = (parentId: string): ICategory[] => {
    return categories.filter(
      (cat) =>
        typeof cat.parent === 'string'
          ? cat.parent === parentId
          : (cat.parent && typeof cat.parent === 'object' && '_id' in cat.parent)
            ? cat.parent._id.toString() === parentId
            : false
    );
  };

  const rootCategories = categories.filter((cat) => !cat.parent);

  const renderCategory = (category: ICategory) => {
    const categoryId = category._id.toString();
    const children = getCategoryChildren(categoryId);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(categoryId);

    return (
      <div key={categoryId} className="mb-1">
        {/* Category Row */}
        <div
          className={`
            flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-white
            hover:bg-gray-50 transition-colors group
          `}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Drag Handle */}
          <button
            type="button"
            className="cursor-move text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag to reorder"
          >
            <GripVertical size={18} />
          </button>

          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(categoryId)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          ) : (
            <div className="w-[18px]" />
          )}

          {/* Folder Icon */}
          <div className="text-blue-600">
            {isExpanded ? <FolderOpen size={20} /> : <Folder size={20} />}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 truncate">
                {category.name}
              </h4>
              {category.isFeatured && (
                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                  Featured
                </span>
              )}
              {!category.isActive && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                  Inactive
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 truncate mt-0.5">
                {category.description}
              </p>
            )}
          </div>

          {/* Product Count */}
          <div className="text-sm text-gray-500">
            {category.productCount || 0} products
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {level < 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddChild(categoryId)}
                title="Add subcategory"
              >
                <Plus size={14} />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
            >
              <Edit size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(category)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            <CategoryTree
              categories={children}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level + 1}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {rootCategories.length > 0 ? (
        rootCategories.map(renderCategory)
      ) : (
        <div className="text-center py-8 text-gray-500">
          No categories found
        </div>
      )}
    </div>
  );
}
