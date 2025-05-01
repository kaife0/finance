import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"
import { ITransaction } from "@/models/Transaction"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency amount
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

// Format date to display format
export function formatDate(date: string | Date): string {
  if (!date) return ''
  
  let dateObj: Date
  if (typeof date === 'string') {
    dateObj = parseISO(date)
    if (!isValid(dateObj)) return 'Invalid Date'
  } else {
    dateObj = date
  }
  
  return format(dateObj, 'MMM d, yyyy')
}

// Get current month in YYYY-MM format for budget filtering
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Group transactions by category
export function groupTransactionsByCategory(transactions: ITransaction[]): Record<string, number> {
  return transactions.reduce((acc: Record<string, number>, transaction) => {
    const category = transaction.category
    const amount = transaction.amount * (transaction.isExpense ? 1 : -1)
    
    if (!acc[category]) {
      acc[category] = 0
    }
    
    acc[category] += amount
    return acc
  }, {})
}

// Calculate total expense and income
export function calculateFinancialSummary(transactions: ITransaction[]) {
  const summary = transactions.reduce(
    (acc, transaction) => {
      const amount = transaction.amount
      
      if (transaction.isExpense) {
        acc.totalExpense += amount
      } else {
        acc.totalIncome += amount
      }
      
      return acc
    },
    { totalExpense: 0, totalIncome: 0 }
  )
  
  summary.balance = summary.totalIncome - summary.totalExpense
  return summary
}

// Filter transactions by month (YYYY-MM format)
export function filterTransactionsByMonth(transactions: ITransaction[], month: string): ITransaction[] {
  if (!month || !transactions?.length) return []
  
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`
    return transactionMonth === month
  })
}

// Helper for handling fetch errors
export async function fetchWithErrorHandling<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)
    
    // Check if the request was successful
    if (!response.ok) {
      // Try to parse error message from response JSON
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error ${response.status}`)
    }
    
    return await response.json() as T
  } catch (error) {
    // Check for network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Network error: Couldn't connect to the server")
    }
    
    // Re-throw the error
    throw error
  }
}

// Format month name from YYYY-MM format
export function formatMonthYearFromString(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-').map(Number)
    const date = new Date(year, month - 1) // Month is 0-indexed in JS Date
    return format(date, 'MMMM yyyy')
  } catch (error) {
    return monthStr // Return original string if parsing fails
  }
}
