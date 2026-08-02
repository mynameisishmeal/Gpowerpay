import mongoose, { Schema, Model } from 'mongoose';
import { ICategory } from '@/types';

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String,
    },
    
    // Hierarchy
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    ancestors: [{
      type: Schema.Types.ObjectId,
      ref: 'Category',
    }],
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    
    // SEO
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    metaKeywords: [{
      type: String,
    }],
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Stats
    productCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Timestamps & Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ parent: 1, order: 1 });
CategorySchema.index({ ancestors: 1 });
CategorySchema.index({ isActive: 1, isFeatured: 1 });

// Pre-save middleware: Generate slug if not provided
CategorySchema.pre('save', async function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Calculate level and ancestors based on parent
  if (this.isModified('parent') && this.parent) {
    const parent = await mongoose.model('Category').findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.ancestors = [...parent.ancestors, parent._id];
    }
  } else if (!this.parent) {
    this.level = 0;
    this.ancestors = [];
  }
});

// Prevent circular references
CategorySchema.pre('save', async function () {
  if (this.parent && this.parent.toString() === this._id.toString()) {
    throw new Error('A category cannot be its own parent');
  }
  
  if (this.parent && this.ancestors.includes(this._id)) {
    throw new Error('Circular reference detected in category hierarchy');
  }
});

// Static method: Get category tree
CategorySchema.statics.getTree = async function(parentId: string | null = null) {
  const query: any = { isActive: true };
  if (parentId === null) {
    query.parent = null;
  } else {
    query.parent = parentId;
  }
  
  const categories = await this.find(query).sort({ order: 1, name: 1 });
  
  const tree = await Promise.all(
    categories.map(async (category: any) => {
      const children = await (this as any).getTree(category._id);
      return {
        ...category.toJSON(),
        children,
      };
    })
  );
  
  return tree;
};

// Static method: Get category with all descendants
CategorySchema.statics.getWithDescendants = async function(categoryId: string) {
  const category = await this.findById(categoryId);
  if (!category) return null;
  
  const descendants = await this.find({
    ancestors: { $in: [categoryId] },
  } as any);
  
  return {
    category,
    descendants,
  };
};

// Export model
const Category: Model<ICategory> = 
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
