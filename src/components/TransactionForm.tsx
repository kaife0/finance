'use client';

import { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRANSACTION_CATEGORIES } from '@/models/Transaction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Form schema with validation
const formSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date({ required_error: 'Date is required' }),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  category: z.string({ required_error: 'Category is required' }),
  isExpense: z.boolean().default(true),
});

// Define form data type based on the schema
type TransactionFormData = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSave: (data: TransactionFormData) => void;
  transaction?: {
    _id?: string;
    amount: number;
    date: string | Date;
    description: string;
    category: string;
    isExpense: boolean;
  } | null;
  onCancel: () => void;
}

export default function TransactionForm({ onSave, transaction, onCancel }: TransactionFormProps) {
  // State to track whether the current transaction is an expense or income
  const [isExpenseState, setIsExpenseState] = useState(true);

  // Filter categories based on transaction type (expense or income)
  const filteredCategories = useMemo(() => {
    return TRANSACTION_CATEGORIES.filter(category => 
      isExpenseState ? category !== 'Income' : true
    );
  }, [isExpenseState]);

  // Initialize the form with useForm hook
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      description: '',
      category: 'Other',
      isExpense: true,
    },
  });

  // Set form values when editing a transaction
  useEffect(() => {
    if (transaction) {
      const isExpense = transaction.isExpense !== false;
      setIsExpenseState(isExpense);
      
      // If switching from expense to income and category is not Income, set to Income
      let category = transaction.category || 'Other';
      if (!isExpense && category !== 'Income') {
        category = 'Income';
      }
      
      form.reset({
        amount: transaction.amount,
        date: new Date(transaction.date),
        description: transaction.description,
        category: category,
        isExpense: isExpense,
      });
    }
  }, [transaction, form]);

  // Handle transaction type change
  const handleTransactionTypeChange = (isExpense: boolean) => {
    setIsExpenseState(isExpense);
    
    // When switching to income, always set category to Income
    if (!isExpense) {
      form.setValue('category', 'Income');
    } else {
      // When switching to expense, set to Other if currently Income
      const currentCategory = form.getValues('category');
      if (currentCategory === 'Income') {
        form.setValue('category', 'Other');
      }
    }
  };

  // Form submission handler
  function onSubmit(values: TransactionFormData) {
    // For income transactions, ensure category is set to Income
    if (!values.isExpense) {
      values.category = 'Income';
    }
    
    onSave(values);
    
    if (!transaction) {
      form.reset({
        amount: 0,
        date: new Date(),
        description: '',
        category: 'Other',
        isExpense: true,
      });
      setIsExpenseState(true);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Transaction Type */}
        <FormField
          control={form.control}
          name="isExpense"
          render={({ field }) => (
            <FormItem
              className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"
              data-active={isExpenseState ? 'expense' : 'income'}
              style={{ borderColor: isExpenseState ? 'var(--destructive)' : 'var(--primary)', opacity: 0.8 }}
            >
              <div className="space-y-0.5">
                <FormLabel>
                  {field.value ? (
                    <div className="flex items-center">
                      <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                      <span>Expense</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                      <span>Income</span>
                    </div>
                  )}
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    handleTransactionTypeChange(checked);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hide category selection for income, or show only expense categories */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              {!isExpenseState ? (
                <FormControl>
                  <Input 
                    value="Income" 
                    disabled 
                    className="bg-green-50 dark:bg-green-950/20"
                  />
                </FormControl>
              ) : (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={!isExpenseState}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Grocery shopping" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4">
          {transaction && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className={transaction ? "ml-auto" : ""}>
            {transaction ? 'Update' : 'Add'} Transaction
          </Button>
        </div>
      </form>
    </Form>
  );
}
