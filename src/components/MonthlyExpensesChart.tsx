'use client';

import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LabelList
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ITransaction } from '@/models/Transaction';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthData {
  name: string;
  expenses: number;
  income: number;
}

interface MonthlyExpensesChartProps {
  transactions: ITransaction[];
  isLoading: boolean;
  showIncome?: boolean;
}

export default function MonthlyExpensesChart({ 
  transactions, 
  isLoading,
  showIncome = true 
}: MonthlyExpensesChartProps) {
  // Generate data for the last 6 months
  const chartData = useMemo(() => {
    // Create array of last 6 months
    const months: MonthData[] = [];
    const today = new Date();
    
    // Initialize with zero values
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthName = format(monthDate, 'MMM yyyy');
      months.push({
        name: monthName,
        expenses: 0,
        income: 0
      });
    }
    
    // No transactions or still loading, return empty months
    if (isLoading || !transactions || transactions.length === 0) {
      return months;
    }
    
    // Populate month data with expenses and income
    transactions.forEach((transaction) => {
      try {
        const txDate = new Date(transaction.date);
        const monthName = format(txDate, 'MMM yyyy');
        
        // Only include transactions from the last 6 months
        const sixMonthsAgo = startOfMonth(subMonths(today, 5));
        if (txDate >= sixMonthsAgo && txDate <= endOfMonth(today)) {
          const monthIndex = months.findIndex((m) => m.name === monthName);
          if (monthIndex !== -1) {
            if (transaction.isExpense) {
              months[monthIndex].expenses += transaction.amount;
            } else {
              months[monthIndex].income += transaction.amount;
            }
          }
        }
      } catch (error) {
        console.error('Error processing transaction date:', error);
      }
    });
    
    return months;
  }, [transactions, isLoading]);

  // Custom tooltip to display both income and expenses
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => {
            const color = entry.name === 'Income' ? 'text-green-500' : 'text-red-500';
            return (
              <p key={`item-${index}`} className={color}>
                {entry.name}: {formatCurrency(entry.value)}
              </p>
            );
          })}
          {payload.length === 2 && (
            <p className="font-medium mt-1 pt-1 border-t text-blue-500">
              Net: {formatCurrency(payload[0].value - payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
        <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-pulse flex space-x-4 w-full">
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-60 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              No transaction data available to display chart
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#888', strokeWidth: 1 }}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  axisLine={{ stroke: '#888', strokeWidth: 1 }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                {showIncome && (
                  <Bar 
                    dataKey="income" 
                    name="Income" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    animationBegin={300}
                    animationDuration={1000}
                  />
                )}
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                  animationBegin={0}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
