import { ITransaction } from '@/models/Transaction';
import { IBudget } from '@/models/Budget';

export interface InsightsData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  transactionsByCategory: Record<string, number>;
  budgetVsActual: Array<{
    category: string;
    budgetAmount: number;
    actualAmount: number;
    remainingAmount: number;
    percentUsed: number;
  }>;
  topCategories: Array<{
    category: string;
    amount: number;
  }>;
  month: string | null;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: string;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = {
      message: errorData.error || 'An error occurred',
      statusCode: response.status,
      details: errorData.details || '',
    };
    throw error;
  }
  return response.json();
}

// Transactions API
export const transactionsApi = {
  getAll: async (): Promise<ITransaction[]> => {
    const response = await fetch('/api/transactions');
    return handleResponse<ITransaction[]>(response);
  },
  
  getById: async (id: string): Promise<ITransaction> => {
    const response = await fetch(`/api/transactions/${id}`);
    return handleResponse<{transaction: ITransaction}>(response).then(data => data.transaction);
  },
  
  create: async (transaction: Omit<ITransaction, '_id'>): Promise<ITransaction> => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    return handleResponse<ITransaction>(response);
  },
  
  update: async (id: string, transaction: Partial<ITransaction>): Promise<ITransaction> => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    return handleResponse<ITransaction>(response);
  },
  
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Budgets API
export const budgetsApi = {
  getAll: async (month?: string): Promise<IBudget[]> => {
    const url = month ? `/api/budgets?month=${month}` : '/api/budgets';
    const response = await fetch(url);
    return handleResponse<{budgets: IBudget[]}>(response).then(data => data.budgets);
  },
  
  getById: async (id: string): Promise<IBudget> => {
    const response = await fetch(`/api/budgets/${id}`);
    return handleResponse<{budget: IBudget}>(response).then(data => data.budget);
  },
  
  create: async (budget: Omit<IBudget, '_id'>): Promise<IBudget> => {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    return handleResponse<{budget: IBudget}>(response).then(data => data.budget);
  },
  
  update: async (id: string, budget: Partial<IBudget>): Promise<IBudget> => {
    const response = await fetch(`/api/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    return handleResponse<{budget: IBudget}>(response).then(data => data.budget);
  },
  
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

// Insights API
export const insightsApi = {
  get: async (month?: string): Promise<InsightsData> => {
    const url = month ? `/api/insights?month=${month}` : '/api/insights';
    const response = await fetch(url);
    return handleResponse<InsightsData>(response);
  },
};

// Function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Try to fetch a minimal amount of data just to test the connection
    const response = await fetch('/api/transactions?limit=1');
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}