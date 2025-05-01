'use client';

import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { TransactionCategory } from '@/models/Transaction';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface Transaction {
  _id: string;
  amount: number;
  date: string;
  description: string;
  category: TransactionCategory;
  isExpense: boolean;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({ 
  transactions, 
  isLoading, 
  onEdit, 
  onDelete 
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (₹)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (transactions.length === 0) {
    return <div className="text-center my-8 text-muted-foreground">No transactions yet. Add your first one!</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount (₹)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            // Determine styles based on transaction type
            const amountTextClass = transaction.isExpense 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400';
            
            const badgeVariant = transaction.isExpense 
              ? "outline" 
              : "default";
            
            const badgeClass = transaction.isExpense
              ? "font-normal"
              : "font-normal bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            
            return (
              <TableRow key={transaction._id} className="group">
                <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={badgeVariant} className={badgeClass}>
                    {transaction.category}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="text-right font-medium">
                  <div className="flex items-center justify-end gap-1 group-hover:gap-2 transition-all">
                    {transaction.isExpense ? 
                      <TrendingDown className="h-4 w-4 text-red-500" /> : 
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    }
                    <span className={amountTextClass}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(transaction)}
                      className="opacity-70 hover:opacity-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(transaction._id)}
                      className="text-red-500 opacity-70 hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
