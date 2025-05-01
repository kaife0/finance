import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { Budget } from '@/models/Budget';
import { groupTransactionsByCategory, calculateFinancialSummary } from '@/lib/utils';
import mongoose from 'mongoose';

// GET insights for dashboard and charts
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    console.log('GET /api/insights: Connecting to database');
    await connectToDatabase();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    // Build the query object
    const transactionQuery: any = {};
    const budgetQuery: any = {};
    
    // Add month filter if provided
    if (month) {
      // For transactions, filter by date
      // Need to handle date range for the month
      const [year, monthNumber] = month.split('-').map(Number);
      const startDate = new Date(year, monthNumber - 1, 1); // Month is 0-indexed in JS Date
      const endDate = new Date(year, monthNumber, 0); // Get last day of month
      
      transactionQuery.date = {
        $gte: startDate,
        $lte: endDate
      };
      
      // For budgets, filter by month string
      budgetQuery.month = month;
    }
    
    // Fetch transactions and budgets based on filters
    const transactions = await Transaction.find(transactionQuery).sort({ date: -1 });
    const budgets = await Budget.find(budgetQuery);
    
    // Calculate insights
    const financialSummary = calculateFinancialSummary(transactions);
    const transactionsByCategory = groupTransactionsByCategory(transactions);
    
    // Calculate budget vs actual
    const budgetVsActual = budgets.map(budget => {
      const { category, amount } = budget;
      const actual = transactionsByCategory[category] || 0;
      const remaining = amount - actual;
      const percentUsed = actual > 0 ? Math.min((actual / amount) * 100, 100) : 0;
      
      return {
        category,
        budgetAmount: amount,
        actualAmount: actual,
        remainingAmount: remaining,
        percentUsed
      };
    });
    
    // Get top spending categories
    const categories = Object.keys(transactionsByCategory)
      .filter(category => transactionsByCategory[category] > 0) // Only expense categories
      .sort((a, b) => transactionsByCategory[b] - transactionsByCategory[a])
      .slice(0, 5) // Top 5
      .map(category => ({
        category,
        amount: transactionsByCategory[category]
      }));
    
    // Return the insights data
    return NextResponse.json({
      summary: financialSummary,
      transactionsByCategory,
      budgetVsActual,
      topCategories: categories,
      month: month || null
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    
    // Check if it's a MongoDB connection error
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      return NextResponse.json(
        { error: 'Failed to connect to the database. Please make sure MongoDB is running.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}