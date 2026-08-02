import Category from '@/models/Category';
import Product from '@/models/Product';
import connectDB from '@/lib/mongodb';
import { ICategory } from '@/types';

/**
 * Category Service Layer
 * Handles business logic for category operations
 */

export class CategoryService {
  /**
   * Get all categories (flat list)
   */
  static async getAllCategories(includeInactive = false): Promise<ICategory[]> {
    await connectDB();

    const query = includeInactive ? {} : { isActive: true };

    return Category.find(query)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 })
      .lean();
  }

  /**
   * Get category tree structure
   */
  static async getCategoryTree(parentId: string | null = null): Promise<any[]> {
    await connectDB();

    const query: any = { isActive: true };
    if (parentId === null) {
      query.parent = null;
    } else {
      query.parent = parentId;
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    // Recursively get children
    const tree = await Promise.all(
      categories.map(async (category) => {
        const children = await this.getCategoryTree(category._id.toString());
        return {
          ...category,
          children,
        };
      })
    );

    return tree;
  }

  /**
   * Get single category by ID or slug
   */
  static async getCategory(identifier: string): Promise<ICategory | null> {
    await connectDB();

    // Try to find by ID first, then by slug
    let category = await Category.findById(identifier)
      .populate('parent', 'name slug');

    if (!category) {
      category = await Category.findOne({ slug: identifier })
        .populate('parent', 'name slug');
    }

    return category;
  }

  /**
   * Get category with descendants
   */
  static async getCategoryWithDescendants(categoryId: string) {
    await connectDB();

    const category = await Category.findById(categoryId)
      .populate('parent', 'name slug');

    if (!category) {
      return null;
    }

    const descendants = await Category.find({
      ancestors: { $in: [categoryId] },
    } as any)
      .sort({ level: 1, order: 1, name: 1 })
      .lean();

    return {
      category,
      descendants,
    };
  }

  /**
   * Create new category
   */
  static async createCategory(
    data: Partial<ICategory>,
    createdBy: string
  ): Promise<ICategory> {
    await connectDB();

    // Validate parent exists if provided
    if (data.parent) {
      const parent = await Category.findById(data.parent);
      if (!parent) {
        throw new Error('Parent category not found');
      }

      // Check depth limit (max 3 levels: 0, 1, 2)
      if (parent.level >= 2) {
        throw new Error('Maximum category depth (3 levels) reached');
      }
    }

    // Create category
    const category = await Category.create({
      ...data,
      createdBy: createdBy as any,
    });

    return category;
  }

  /**
   * Update category
   */
  static async updateCategory(
    categoryId: string,
    data: Partial<ICategory>
  ): Promise<ICategory | null> {
    await connectDB();

    const category = await Category.findById(categoryId);
    if (!category) {
      return null;
    }

    // If parent is changing, validate
    if (data.parent && data.parent.toString() !== category.parent?.toString()) {
      // Can't set self as parent
      if (data.parent.toString() === categoryId) {
        throw new Error('A category cannot be its own parent');
      }

      // Check if new parent exists
      const newParent = await Category.findById(data.parent);
      if (!newParent) {
        throw new Error('Parent category not found');
      }

      // Check depth limit
      if (newParent.level >= 2) {
        throw new Error('Maximum category depth (3 levels) reached');
      }

      // Check for circular reference
      if (newParent.ancestors.includes(category._id)) {
        throw new Error('Circular reference detected. Parent cannot be a descendant of this category');
      }
    }

    // Update category
    Object.assign(category, data);
    await category.save();

    // Update all descendants if parent changed
    if (data.parent !== undefined && data.parent?.toString() !== category.parent?.toString()) {
      await this.updateDescendantsHierarchy(categoryId);
    }

    return category;
  }

  /**
   * Delete category
   */
  static async deleteCategory(categoryId: string, deleteProducts = false): Promise<boolean> {
    await connectDB();

    const category = await Category.findById(categoryId);
    if (!category) {
      return false;
    }

    // Check if category has children
    const childCount = await Category.countDocuments({ parent: categoryId } as any);
    if (childCount > 0) {
      throw new Error('Cannot delete category with subcategories. Delete subcategories first.');
    }

    // Check if category has products
    if (category.productCount > 0) {
      if (deleteProducts) {
        // Delete all products in this category
        await Product.deleteMany({ category: categoryId } as any);
      } else {
        throw new Error(
          `Cannot delete category with ${category.productCount} product(s). Move or delete products first.`
        );
      }
    }

    await category.deleteOne();
    return true;
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(
    categoryOrders: { id: string; order: number }[]
  ): Promise<void> {
    await connectDB();

    const bulkOps = categoryOrders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } },
      },
    })) as any;

    await Category.bulkWrite(bulkOps);
  }

  /**
   * Get featured categories
   */
  static async getFeaturedCategories(limit = 6): Promise<ICategory[]> {
    await connectDB();

    return Category.find({
      isActive: true,
      isFeatured: true,
    })
      .sort({ order: 1, name: 1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get top-level categories (no parent)
   */
  static async getTopLevelCategories(): Promise<ICategory[]> {
    await connectDB();

    return Category.find({
      parent: null,
      isActive: true,
    })
      .sort({ order: 1, name: 1 })
      .lean();
  }

  /**
   * Get categories by parent
   */
  static async getCategoriesByParent(parentId: string): Promise<ICategory[]> {
    await connectDB();

    return Category.find({
      parent: parentId,
      isActive: true,
    } as any)
      .sort({ order: 1, name: 1 })
      .lean();
  }

  /**
   * Search categories
   */
  static async searchCategories(query: string): Promise<ICategory[]> {
    await connectDB();

    return Category.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
      isActive: true,
    })
      .sort({ name: 1 })
      .limit(20)
      .lean();
  }

  /**
   * Update product counts for all categories
   */
  static async updateProductCounts(): Promise<void> {
    await connectDB();

    const categories = await Category.find();

    for (const category of categories) {
      const count = await Product.countDocuments({
        category: category._id,
        status: 'active',
      });

      category.productCount = count;
      await category.save();
    }
  }

  /**
   * Private: Update descendants hierarchy after parent change
   */
  private static async updateDescendantsHierarchy(categoryId: string): Promise<void> {
    const category = await Category.findById(categoryId);
    if (!category) return;

    // Get all descendants
    const descendants = await Category.find({ ancestors: { $in: [categoryId] } } as any);

    for (const descendant of descendants) {
      // Rebuild ancestors array
      const ancestors = [...category.ancestors, category._id];
      
      // Find additional ancestors up to this descendant
      let current: any = descendant.parent;
      while (current && !ancestors.includes(current)) {
        const parent = await Category.findById(current);
        if (parent && parent._id.toString() !== categoryId) {
          ancestors.push(parent._id);
          current = parent.parent;
        } else {
          break;
        }
      }

      descendant.ancestors = ancestors;
      descendant.level = ancestors.length;
      await descendant.save();
    }
  }
}
