'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfMonth, endOfMonth, format, isWithinInterval, parse } from 'date-fns';
import { ITransaction, TransactionCategory } from '@/models/Transaction';
import { IBudget } from '@/models/Budget';
import { InsightsData } from '@/lib/api-service';
import { formatCurrency } from '@/lib/utils';

interface BudgetVsActualChartProps {
  transactions: ITransaction[];
  budgets: IBudget[];
  month: string;
  insights: InsightsData | null;
  isLoading: boolean;
}

export default function BudgetVsActualChart({ 
  transactions, 
  budgets, 
  month,
  insights,
  isLoading
}: BudgetVsActualChartProps) {
  // Calculate budget vs actual spending for the selected month
  const chartData = useMemo(() => {
    if (isLoading) {
      return {
        categoryData: [],
        monthName: ''
      };
    }

    // If we have insights data, use it for budget vs actual comparison
    if (insights && insights.budgetVsActual && insights.budgetVsActual.length > 0) {
      // Format month name
      let monthName = '';
      try {
        const date = parse(month, 'yyyy-MM', new Date());
        monthName = format(date, 'MMMM yyyy');
      } catch (error) {
        console.error('Error parsing month:', error);
        monthName = month;
      }

      // Transform insights data to chart format
      const categoryData = insights.budgetVsActual
        .map(item => ({
          category: item.category as TransactionCategory,
          budget: item.budgetAmount,
          actual: item.actualAmount,
          percentage: item.percentUsed,
          overBudget: item.actualAmount > item.budgetAmount && item.budgetAmount > 0,
          remaining: Math.max(item.budgetAmount - item.actualAmount, 0)
        }))
        .filter(item => item.budget > 0 || item.actual > 0); // Only show categories with budget or spending

      // Sort data: overbudget items first, then by highest percentage
      categoryData.sort((a, b) => {
        if (a.overBudget && !b.overBudget) return -1;
        if (!a.overBudget && b.overBudget) return 1;
        return b.percentage - a.percentage;
      });

      return {
        categoryData,
        monthName
      };
    }

    // If no insights data, calculate from transactions and budgets
    try {
      // Parse month to get date range
      const [year, monthNum] = month.split('-').map(Number);
      const monthStart = new Date(year, monthNum - 1, 1);
      const monthEnd = endOfMonth(monthStart);
      const monthRange = { start: monthStart, end: monthEnd };
      const monthName = format(monthStart, 'MMMM yyyy');

      // Get filtered transactions for the month
      const monthTransactions = transactions.filter(transaction => {
        if (!transaction.date) return false;
        
        try {
          const txDate = new Date(transaction.date);
          return transaction.isExpense && isWithinInterval(txDate, monthRange);
        } catch (error) {
          console.error('Error parsing transaction date:', error);
          return false;
        }
      });

      // Aggregate spending by category
      const spendingByCategory = new Map<TransactionCategory, number>();
      
      monthTransactions.forEach(transaction => {
        const currentAmount = spendingByCategory.get(transaction.category as TransactionCategory) || 0;
        spendingByCategory.set(transaction.category as TransactionCategory, currentAmount + transaction.amount);
      });
      
      // Calculate budget utilization by category
      const filteredBudgets = budgets.filter(b => b.month === month);
      const categoryData = filteredBudgets.map(budget => {
        const actual = spendingByCategory.get(budget.category as TransactionCategory) || 0;
        const percentage = budget.amount > 0 ? Math.min((actual / budget.amount) * 100, 100) : 0;
        
        return {
          category: budget.category as TransactionCategory,
          budget: budget.amount,
          actual,
          percentage,
          overBudget: actual > budget.amount && budget.amount > 0,
          remaining: Math.max(budget.amount - actual, 0)
        };
      });
      
      // Sort data: overbudget items first, then by highest percentage
      categoryData.sort((a, b) => {
        if (a.overBudget && !b.overBudget) return -1;
        if (!a.overBudget && b.overBudget) return 1;
        return b.percentage - a.percentage;
      });
      
      return {
        categoryData,
        monthName
      };
    } catch (error) {
      console.error('Error processing budget chart data:', error);
      return {
        categoryData: [],
        monthName: month
      };
    }
  }, [transactions, budgets, month, insights, isLoading]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <div className="animate-pulse flex space-x-4 w-full">
            <div className="flex-1 space-y-6 py-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if there are budgets for the selected month
  const hasBudgets = budgets.some(budget => budget.month === month);

  // No budgets for current month
  if (!hasBudgets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Spending against budget targets</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              No budgets set for {chartData.monthName || month}
            </p>
            <p className="text-sm text-muted-foreground">
              Add budgets using the "Manage Budgets" tab to track your spending against targets
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if there's actual data to display
  const hasData = chartData.categoryData.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Spending against budget targets</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">No budget or expense data found for {chartData.monthName}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Budget vs Actual</CardTitle>
        <CardDescription>
          Spending for {chartData.monthName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {chartData.categoryData.map((item, index) => {
            // Calculate visual properties based on the actual percentage
            const displayPercentage = Math.min(item.percentage, 100);
            const actualPercentage = Math.round(item.percentage);
            
            // Determine color based on percentage
            let progressColor = 'bg-green-500 dark:bg-green-600';
            let textColor = 'text-green-600 dark:text-green-500';
            let bgColor = 'bg-green-100 dark:bg-green-900/20';
            
            if (actualPercentage >= 95) {
              progressColor = 'bg-red-500 dark:bg-red-600';
              textColor = 'text-red-600 dark:text-red-500';
              bgColor = 'bg-red-100 dark:bg-red-900/20';
            } else if (actualPercentage >= 80) {
              progressColor = 'bg-orange-500 dark:bg-orange-600';
              textColor = 'text-orange-600 dark:text-orange-500';
              bgColor = 'bg-orange-100 dark:bg-orange-900/20';
            } else if (actualPercentage >= 60) {
              progressColor = 'bg-yellow-500 dark:bg-yellow-600';
              textColor = 'text-yellow-600 dark:text-yellow-500';
              bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
            }
            
            return (
              <div 
                key={item.category} 
                className="space-y-2 animate-fadeIn"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <div className="flex justify-between text-sm font-medium">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${progressColor} mr-2`}></div>
                    <div>{item.category}</div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={item.overBudget ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}>
                      {formatCurrency(item.actual)}
                    </span>
                    <span>/</span>
                    <span>{formatCurrency(item.budget)}</span>
                  </div>
                </div>
                
                <div className={`w-full ${bgColor} rounded-full h-3`}>
                  <div 
                    className={`h-3 rounded-full ${progressColor} transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${displayPercentage}%`,
                    }}
                  />
                </div>
                
                {/* Show remaining budget or over budget indicator */}
                <div className="flex justify-between text-xs">
                  <div className={`font-medium ${textColor}`}>
                    {actualPercentage}%
                  </div>
                  <div>
                    {item.overBudget ? (
                      <span className="text-red-500 dark:text-red-400 font-medium">
                        Over by {formatCurrency(item.actual - item.budget)}
                      </span>
                    ) : (
                      <span className={`${textColor} font-medium`}>
                        {formatCurrency(item.remaining)} remaining
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
