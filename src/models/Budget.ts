import mongoose, { Schema, Document } from 'mongoose';
import { TRANSACTION_CATEGORIES, TransactionCategory } from './Transaction';

export interface IBudget extends Document {
  category: TransactionCategory;
  amount: number;
  month: string; // Format: YYYY-MM
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a schema for Budget
const BudgetSchema = new Schema<IBudget>(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: TRANSACTION_CATEGORIES,
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget amount must be positive'],
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM'],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure uniqueness of category+month
BudgetSchema.index({ category: 1, month: 1 }, { unique: true });

// Check if the model exists before creating it to avoid model overwrite errors
// during hot reloading in development
const BudgetModel = mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

// Export as a named export to match how it's imported in routes
export { BudgetModel as Budget };
