'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { IBudget } from '@/models/Budget';
import BudgetList from './BudgetList';
import BudgetVsActualChart from './BudgetVsActualChart';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import BudgetForm from './BudgetForm';
import { budgetsApi, ApiError, InsightsData } from '@/lib/api-service';
import { ITransaction } from '@/models/Transaction';
import { formatCurrency } from '@/lib/utils';

// Generate an array of the last 12 months in YYYY-MM format
const getLast12Months = () => {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(format(month, 'yyyy-MM'));
  }
  
  return months;
};

interface BudgetPageProps {
  transactions: ITransaction[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
  insights: InsightsData | null;
}

export default function BudgetPage({ 
  transactions, 
  currentMonth, 
  onMonthChange,
  insights
}: BudgetPageProps) {
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<IBudget | null>(null);
  const months = getLast12Months();

  // Fetch budgets from the API
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetsApi.getAll(currentMonth);
      setBudgets(data);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to load budgets');
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load budgets on initial render and when month changes
  useEffect(() => {
    fetchBudgets();
  }, [currentMonth]);

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy');
  };

  // Handle budget editing
  const handleEditBudget = (budget: IBudget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  // Handle budget saving
  const handleSaveBudget = async (data: Omit<IBudget, '_id'>) => {
    try {
      if (editingBudget && editingBudget._id) {
        await budgetsApi.update(editingBudget._id, data);
        toast.success('Budget updated successfully');
      } else {
        await budgetsApi.create(data);
        toast.success('Budget created successfully');
      }
      setIsFormOpen(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Failed to save budget';
      
      if (errorMessage.includes('already exists')) {
        toast.error('A budget for this category and month already exists');
      } else {
        toast.error(errorMessage);
      }
      
      console.error('Error saving budget:', error);
    }
  };

  // Handle budget deletion
  const handleDeleteBudget = async (id: string) => {
    try {
      await budgetsApi.delete(id);
      toast.success('Budget deleted successfully');
      fetchBudgets();
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to delete budget');
      console.error('Error deleting budget:', error);
    }
  };

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight page-header">Budget Management</h2>
          <p className="text-muted-foreground mt-2">Set and track spending limits for each category</p>
        </div>
        <Button 
          onClick={() => {
            setEditingBudget(null);
            setIsFormOpen(true);
          }} 
          className="bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90"
        >
          <span className="mr-2">+</span> Quick Add Budget
        </Button>
      </div>

      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg max-w-xs">
        <CalendarIcon className="h-5 w-5 text-primary" />
        <Select value={currentMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[180px] border-none bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map(month => (
              <SelectItem key={month} value={month}>
                {formatMonth(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="overview" className="text-sm md:text-base">Overview</TabsTrigger>
          <TabsTrigger value="manage" className="text-sm md:text-base">Manage Budgets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <BudgetVsActualChart 
            transactions={transactions} 
            budgets={budgets}
            month={currentMonth}
            insights={insights}
            isLoading={loading}
          />
          
          <Card className="dashboard-card border-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Budget Summary: {formatMonth(currentMonth)}</CardTitle>
              <CardDescription>Track your spending against budgeted amounts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="dashboard-card border-0">
                      <CardHeader className="pb-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse mb-1"></div>
                        <div className="flex justify-between mt-2">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 animate-pulse"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : budgets.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No budgets set for {formatMonth(currentMonth)}. Add a budget to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgets.map(budget => {
                    // Get data from insights if available
                    let actualSpending = 0;
                    let percentUsed = 0;
                    
                    if (insights && insights.budgetVsActual) {
                      const budgetData = insights.budgetVsActual.find(b => b.category === budget.category);
                      if (budgetData) {
                        actualSpending = budgetData.actualAmount;
                        percentUsed = budgetData.percentUsed;
                      }
                    } else {
                      // Calculate manually if insights aren't available
                      actualSpending = transactions
                        .filter(t => {
                          const tMonth = format(new Date(t.date), 'yyyy-MM');
                          return tMonth === currentMonth && 
                                t.category === budget.category &&
                                t.isExpense;
                        })
                        .reduce((sum, t) => sum + t.amount, 0);
                      
                      // Calculate percentage of budget used
                      percentUsed = budget.amount > 0 
                        ? Math.min(Math.round((actualSpending / budget.amount) * 100), 100)
                        : 0;
                    }
                    
                    // Determine status based on percentage used
                    let status = 'text-green-500';
                    if (percentUsed > 100) {
                      status = 'text-red-500';
                    } else if (percentUsed > 80) {
                      status = 'text-amber-500';
                    }
                    
                    return (
                      <Card key={budget._id} className="dashboard-card card-hover-effect border-0 overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/30 dark:to-background">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            {budget.category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            <span className={status}>{formatCurrency(actualSpending)}</span> 
                            <span className="text-sm font-normal text-muted-foreground"> / {formatCurrency(budget.amount)}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
                            <div 
                              className={`h-2.5 rounded-full ${percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(percentUsed, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <div className={`text-xs font-medium ${status}`}>
                              {percentUsed}% used
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {percentUsed > 100 ? 'Over budget!' : percentUsed > 80 ? 'Almost at limit' : 'Under budget'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage">
          <BudgetList 
            budgets={budgets} 
            isLoading={loading}
            onEdit={handleEditBudget}
            onDelete={handleDeleteBudget}
            currentMonth={currentMonth}
          />
        </TabsContent>
      </Tabs>
      
      {/* Budget Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[525px] bg-white dark:bg-slate-900 shadow-lg border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingBudget ? 'Edit Budget' : 'Add New Budget'}</DialogTitle>
          </DialogHeader>
          <BudgetForm 
            onSave={handleSaveBudget}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingBudget(null);
            }}
            budget={editingBudget}
            currentMonth={currentMonth}
          />
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        /* Ensure dialog overlay is dark enough for good contrast */
        [data-slot="dialog-overlay"] {
          background-color: rgba(0, 0, 0, 0.7);
        }
        
        /* Ensure dialog content has a solid background */
        [data-slot="dialog-content"] {
          background-color: white !important;
          backdrop-filter: none !important;
        }
        
        /* Dark mode support */
        .dark [data-slot="dialog-content"] {
          background-color: hsl(var(--slate-900)) !important;
        }
        
        /* Override z-index for all select elements in dialog */
        .dialog-content [data-radix-select-content] {
          z-index: 1100 !important;
        }
      `}</style>
    </div>
  );
}
