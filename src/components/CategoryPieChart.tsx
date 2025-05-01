'use client';

import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  Sector
} from 'recharts';
import { ITransaction, TRANSACTION_CATEGORIES, TransactionCategory } from '@/models/Transaction';
import { InsightsData } from '@/lib/api-service';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

// Fixed colors for categories
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DD0',
  '#FF6B6B', '#4ECDC4', '#C7F464', '#FF9800', '#9C27B0',
  '#3F51B5', '#03A9F4', '#8BC34A', '#FFC107', '#795548'
];

// Create a mapping between categories and colors
const categoryColorMap = Object.fromEntries(
  TRANSACTION_CATEGORIES.map((category, index) => [category, COLORS[index % COLORS.length]])
);

interface CategoryPieChartProps {
  transactions: ITransaction[];
  insights: InsightsData | null;
  isLoading: boolean;
  expensesOnly?: boolean; // When true, only show expenses
}

// Render custom active shape for better tooltip visualization
const renderActiveShape = (props: any) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

// Custom label that prevents overlaps
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value
}: any) => {
  const RADIAN = Math.PI / 180;
  // Position the label away from the pie to avoid overlapping
  const radius = outerRadius * 1.1;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Only show labels for segments that are significant enough (>= 5%)
  if (percent < 0.05) return null;
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="#888"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name}`}
    </text>
  );
};

export default function CategoryPieChart({ 
  transactions, 
  insights,
  isLoading,
  expensesOnly = true 
}: CategoryPieChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  };
  
  const chartData = useMemo(() => {
    if (isLoading) {
      return [];
    }

    // If we have insights data with transaction categories, use it
    if (insights && insights.transactionsByCategory) {
      const categoryData = Object.entries(insights.transactionsByCategory)
        // Filter out income categories if expensesOnly is true
        .filter(([category, value]) => {
          if (expensesOnly) {
            return value > 0 && category !== 'Income';
          }
          return true;
        })
        .map(([category, value]) => ({
          name: category,
          value: Math.abs(value),
          color: categoryColorMap[category as TransactionCategory] || '#CCCCCC'
        }))
        .sort((a, b) => b.value - a.value);

      return categoryData;
    }

    // Otherwise, calculate from transactions
    // Filter transactions if needed
    const filteredTransactions = expensesOnly 
      ? transactions.filter(t => t.isExpense && t.category !== 'Income') 
      : transactions;
    
    if (!filteredTransactions.length) {
      return [];
    }

    // Group transactions by category and sum amounts
    const categoryMap = new Map<string, number>();
    
    filteredTransactions.forEach((transaction) => {
      const { category, amount } = transaction;
      const currentTotal = categoryMap.get(category) || 0;
      categoryMap.set(category, currentTotal + amount);
    });

    // Convert to chart data format and sort by value (descending)
    const data: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: categoryColorMap[name as TransactionCategory] || '#CCCCCC'
      }))
      .sort((a, b) => b.value - a.value);

    return data;
  }, [transactions, expensesOnly, insights, isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px] flex-col space-y-4">
        <div className="w-[200px] h-[200px] rounded-full overflow-hidden relative">
          <Skeleton className="h-full w-full absolute" />
        </div>
        <Skeleton className="w-[150px] h-[20px]" />
      </div>
    );
  }

  // No data state
  if (!chartData.length) {
    return (
      <div className="flex justify-center items-center h-[300px] text-muted-foreground">
        No transaction data available to display chart
      </div>
    );
  }

  // Calculate total for percentage
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-background border rounded-md shadow-sm p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={0}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            activeIndex={activeIndex !== null ? activeIndex : undefined}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            label={renderCustomizedLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            align="right" 
            verticalAlign="middle"
            formatter={(value, entry: any) => {
              // Format legend items with percentage
              const item = chartData.find(d => d.name === value);
              if (item) {
                const percent = ((item.value / total) * 100).toFixed(0);
                return <span className="text-sm">{value} ({percent}%)</span>;
              }
              return value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
