'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TRANSACTION_CATEGORIES, TransactionCategory } from '@/models/Transaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parse } from 'date-fns';
import { IBudget } from '@/models/Budget';

// Form schema with validation
const formSchema = z.object({
  category: z.string({ required_error: 'Category is required' }),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  notes: z.string().optional(),
});

type BudgetFormData = Omit<IBudget, '_id' | 'createdAt' | 'updatedAt'>;

interface BudgetFormProps {
  onSave: (data: BudgetFormData) => void;
  budget?: IBudget | null;
  onCancel: () => void;
  currentMonth?: string;
}

export default function BudgetForm({ onSave, budget, onCancel, currentMonth }: BudgetFormProps) {
  // Use provided month or fallback to current month in YYYY-MM format
  const defaultMonth = currentMonth || format(new Date(), 'yyyy-MM');

  // Initialize the form with useForm hook
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: '',
      amount: 0,
      month: defaultMonth,
      notes: '',
    },
  });

  // Set form values when editing a budget
  useEffect(() => {
    if (budget) {
      form.reset({
        category: budget.category,
        amount: budget.amount,
        month: budget.month,
        notes: budget.notes || '',
      });
    } else {
      // Reset form with default values when not editing
      form.reset({
        category: '',
        amount: 0,
        month: defaultMonth,
        notes: '',
      });
    }
  }, [budget, form, defaultMonth]);

  // Generate last 12 months for month dropdown
  const getLast12Months = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(format(month, 'yyyy-MM'));
    }
    
    return months;
  };

  const months = getLast12Months();

  // Format month for display
  const formatMonthDisplay = (monthStr: string) => {
    try {
      const date = parse(monthStr, 'yyyy-MM', new Date());
      return format(date, 'MMMM yyyy');
    } catch {
      return monthStr;
    }
  };

  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Convert form values to BudgetFormData
    const budgetData: BudgetFormData = {
      category: values.category as TransactionCategory,
      amount: values.amount,
      month: values.month,
      notes: values.notes && values.notes.trim() !== '' ? values.notes : undefined
    };
    onSave(budgetData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full bg-background border border-input focus:ring-2 focus:ring-ring">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background border border-input z-[1100] shadow-md">
                  {TRANSACTION_CATEGORIES.filter(
                    // Filter out Income category, as typically budgets are for expenses
                    category => category !== 'Income'
                  ).map((category) => (
                    <SelectItem key={category} value={category} className="cursor-pointer hover:bg-accent">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />

        {/* Budget Amount field */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Budget Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-foreground">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7 bg-background border-input focus:ring-2 focus:ring-ring"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />

        {/* Month field */}
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Month</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full bg-background border border-input focus:ring-2 focus:ring-ring">
                    <SelectValue placeholder="Select a month" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background border border-input z-[1100] shadow-md">
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="cursor-pointer hover:bg-accent">
                      {formatMonthDisplay(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />

        {/* Notes field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any notes about this budget" 
                  className="bg-background border-input min-h-[80px] focus:ring-2 focus:ring-ring" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-destructive" />
            </FormItem>
          )}
        />

        {/* Form actions */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            type="button"
            className="border-input hover:bg-accent"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-primary hover:bg-primary/90"
          >
            {budget ? 'Update' : 'Create'} Budget
          </Button>
        </div>
      </form>

      <style jsx global>{`
        /* Override select dropdowns to ensure they appear above dialog */
        [data-radix-popper-content-wrapper] {
          z-index: 1100 !important;
        }

        /* Ensure select content is properly visible */
        .select-content {
          background-color: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        /* Override any transparency */
        .select-dropdown,
        [data-slot="select-content"] {
          opacity: 1 !important;
          background-color: hsl(var(--background)) !important;
        }
      `}</style>
    </Form>
  );
}
