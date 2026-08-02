import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Wallet from '@/models/Wallet';

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const monthStart = new Date(now.setDate(1));

    // Fetch all stats in parallel
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      todayOrders,
      totalUsers,
      verifiedUsers,
      newUsersToday,
      totalProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      walletStats,
    ] = await Promise.all([
      // Orders
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.find({ createdAt: { $gte: todayStart } }),
      
      // Users
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', emailVerified: true }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: todayStart } }),
      
      // Products
      Product.countDocuments(),
      Product.countDocuments({
        $or: [
          { 'inventory.kilo.trackInventory': false },
          { 'inventory.kilo.stock': { $gt: 0 } },
          { 'inventory.carton.trackInventory': false },
          { 'inventory.carton.stock': { $gt: 0 } },
        ],
      }),
      Product.countDocuments({
        $or: [
          {
            'inventory.kilo.trackInventory': true,
            'inventory.kilo.stock': { $lte: 10, $gt: 0 },
          },
          {
            'inventory.carton.trackInventory': true,
            'inventory.carton.stock': { $lte: 10, $gt: 0 },
          },
        ],
      }),
      Product.countDocuments({
        $and: [
          {
            $or: [
              { 'inventory.kilo.trackInventory': false },
              { 'inventory.kilo.stock': 0 },
            ],
          },
          {
            $or: [
              { 'inventory.carton.trackInventory': false },
              { 'inventory.carton.stock': 0 },
            ],
          },
        ],
      }),
      
      // Revenue
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      
      // Wallet
      Wallet.aggregate([
        {
          $facet: {
            totalBalance: [
              { $group: { _id: null, total: { $sum: '$balance' } } },
            ],
            totalCredits: [
              { $unwind: '$transactions' },
              { $match: { 'transactions.type': 'credit' } },
              { $group: { _id: null, total: { $sum: '$transactions.amount' } } },
            ],
            totalDebits: [
              { $unwind: '$transactions' },
              { $match: { 'transactions.type': 'debit' } },
              { $group: { _id: null, total: { $sum: '$transactions.amount' } } },
            ],
            todayTransactions: [
              { $unwind: '$transactions' },
              { $match: { 'transactions.createdAt': { $gte: todayStart } } },
              { $count: 'count' },
            ],
          },
        },
      ]),
    ]);

    const stats = {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        todayCount: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      },
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
        newToday: newUsersToday,
      },
      products: {
        total: totalProducts,
        inStock: inStockProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        thisWeek: weekRevenue[0]?.total || 0,
        thisMonth: monthRevenue[0]?.total || 0,
      },
      wallet: {
        totalBalance: walletStats[0]?.totalBalance[0]?.total || 0,
        totalCredits: walletStats[0]?.totalCredits[0]?.total || 0,
        totalDebits: walletStats[0]?.totalDebits[0]?.total || 0,
        todayTransactions: walletStats[0]?.todayTransactions[0]?.count || 0,
      },
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
