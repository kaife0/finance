'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import MonthlyExpensesChart from '@/components/MonthlyExpensesChart';
import CategoryPieChart from '@/components/CategoryPieChart';
import Dashboard from '@/components/Dashboard';
import BudgetPage from '@/components/BudgetPage';
import { transactionsApi, insightsApi, InsightsData, ApiError } from '@/lib/api-service';
import { ITransaction } from '@/models/Transaction';
import { getCurrentMonth } from '@/lib/utils';

export default function Home() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null);
  const [dbConnectionError, setDbConnectionError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());
  const [activeTab, setActiveTab] = useState<string>("transactions");

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setDbConnectionError(null);
      const data = await transactionsApi.getAll();
      setTransactions(data);
    } catch (error: unknown) {
      console.error('Error fetching transactions:', error);
      const apiError = error as ApiError;
      
      // Check if it's a database connection error
      if (apiError.message && apiError.message.includes('database')) {
        setDbConnectionError(apiError.message);
      }
      
      toast.error(apiError.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch insights for the dashboard
  const fetchInsights = async (month?: string) => {
    try {
      setIsInsightsLoading(true);
      const data = await insightsApi.get(month);
      setInsights(data);
    } catch (error: unknown) {
      console.error('Error fetching insights:', error);
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to fetch financial insights');
    } finally {
      setIsInsightsLoading(false);
    }
  };
  
  // Initial data loading
  useEffect(() => {
    fetchTransactions();
    fetchInsights(currentMonth);
  }, [currentMonth]);
  
  // Handle create/update transaction
  const handleSaveTransaction = async (transactionData: Omit<ITransaction, '_id'>) => {
    try {
      if (selectedTransaction) {
        // Update existing transaction
        await transactionsApi.update(selectedTransaction._id, transactionData);
        toast.success('Transaction updated successfully');
      } else {
        // Create new transaction
        await transactionsApi.create(transactionData);
        toast.success('Transaction added successfully');
      }
      
      setSelectedTransaction(null);
      await fetchTransactions();
      await fetchInsights(currentMonth); // Refresh insights after transaction changes
      
      // Switch back to transactions tab after saving
      setActiveTab("transactions");
    } catch (error: unknown) {
      console.error('Error saving transaction:', error);
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to save transaction');
    }
  };
  
  // Handle delete transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      toast.success('Transaction deleted successfully');
      await fetchTransactions();
      await fetchInsights(currentMonth); // Refresh insights after transaction changes
    } catch (error: unknown) {
      console.error('Error deleting transaction:', error);
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to delete transaction');
    }
  };
  
  // Handle edit transaction
  const handleEditTransaction = (transaction: ITransaction) => {
    setSelectedTransaction(transaction);
    // Automatically switch to edit tab
    setActiveTab("add");
  };
  
  // Handle month change for filtering
  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };
  
  return (
    <main className="container mx-auto py-8 px-4 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold page-header">Personal Finance Visualizer</h1>
          <p className="text-muted-foreground mt-2">Track, analyze, and optimize your finances</p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
      
      {/* Database Connection Error Message */}
      {dbConnectionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Database Connection Error</p>
              <p className="text-sm">{dbConnectionError}</p>
              <p className="text-sm mt-2">Make sure MongoDB is installed and running on your system, or check your MongoDB Atlas connection string in the .env.local file.</p>
              <button 
                className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                onClick={() => fetchTransactions()}
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard Summary Cards */}
      <div className="mb-8 slide-up">
        <Dashboard 
          transactions={transactions} 
          insights={insights} 
          isLoading={isLoading || isInsightsLoading} 
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 max-w-3xl mx-auto">
          <TabsTrigger value="transactions" className="text-sm md:text-base">Transactions</TabsTrigger>
          <TabsTrigger value="charts" className="text-sm md:text-base">Charts</TabsTrigger>
          <TabsTrigger value="budgets" className="text-sm md:text-base">Budgets</TabsTrigger>
          <TabsTrigger value="add" className="text-sm md:text-base">{selectedTransaction ? 'Edit' : 'Add'} Transaction</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4 slide-up">
          <Card className="dashboard-card overflow-hidden border-0">
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View and manage your transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList 
                transactions={transactions} 
                isLoading={isLoading} 
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4 slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Expenses Chart */}
            <Card className="dashboard-card border-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Monthly Expenses</CardTitle>
                <CardDescription>Your spending trend over the past months</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyExpensesChart 
                  transactions={transactions} 
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
            
            {/* Category Breakdown */}
            <Card className="dashboard-card border-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryPieChart 
                  transactions={transactions} 
                  insights={insights}
                  isLoading={isLoading || isInsightsLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="budgets" className="slide-up">
          <BudgetPage 
            transactions={transactions} 
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            insights={insights}
          />
        </TabsContent>
        
        <TabsContent value="add" className="slide-up">
          <Card className="dashboard-card border-0 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
              <CardDescription>
                {selectedTransaction ? 'Update transaction details' : 'Fill in the details to add a new transaction'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionForm 
                onSave={handleSaveTransaction}
                transaction={selectedTransaction}
                onCancel={() => {
                  setSelectedTransaction(null);
                  setActiveTab("transactions");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
