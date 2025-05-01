'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parse } from 'date-fns';
import { IBudget } from '@/models/Budget';
import { formatCurrency } from '@/lib/utils';
import BudgetForm from './BudgetForm';

interface BudgetListProps {
  budgets: IBudget[];
  isLoading: boolean;
  onEdit: (budget: IBudget) => void;
  onDelete: (id: string) => void;
  currentMonth: string;
}

export default function BudgetList({ 
  budgets, 
  isLoading, 
  onEdit, 
  onDelete,
  currentMonth 
}: BudgetListProps) {
  // Format month string (YYYY-MM) to a more readable format (Month YYYY)
  const formatMonth = (monthStr: string) => {
    try {
      const date = parse(monthStr, 'yyyy-MM', new Date());
      return format(date, 'MMMM yyyy');
    } catch {
      return monthStr; // Fallback to original string
    }
  };

  // Filter budgets for current month if needed for highlighting
  const isCurrentMonthBudget = (budget: IBudget) => budget.month === currentMonth;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No budgets found. Create your first budget to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow 
                  key={budget._id} 
                  className={isCurrentMonthBudget(budget) ? 'bg-primary/5' : ''}
                >
                  <TableCell>
                    <Badge variant={isCurrentMonthBudget(budget) ? "default" : "outline"}>
                      {budget.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatMonth(budget.month)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(budget.amount)}
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]">
                    {budget.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEdit(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDeleteButton 
                      onConfirmDelete={() => onDelete(budget._id)} 
                      budget={budget} 
                      formatMonth={formatMonth}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Small component to handle delete confirmation inline
function AlertDeleteButton({ 
  onConfirmDelete, 
  budget,
  formatMonth
}: { 
  onConfirmDelete: () => void; 
  budget: IBudget;
  formatMonth: (month: string) => string;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the budget for {budget.category} ({formatMonth(budget.month)}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onConfirmDelete();
                setOpen(false);
              }} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
