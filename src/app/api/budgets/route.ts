import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Budget } from '@/models/Budget';
import mongoose from 'mongoose';

// GET route to fetch all budgets
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    console.log('GET /api/budgets: Connecting to database');
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to the database', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database connection error' 
        },
        { status: 500 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const category = searchParams.get('category');

    // Build query object based on provided filters
    const query: Record<string, string> = {};
    if (month) query.month = month;
    if (category) query.category = category;

    // Fetch budgets with optional filters
    console.log('GET /api/budgets: Fetching budgets with filters:', query);
    const budgets = await Budget.find(query).sort({ category: 1 });
    console.log(`GET /api/budgets: Found ${budgets.length} budgets`);

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    
    // Check if it's a MongoDB connection error
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      return NextResponse.json(
        { error: 'Failed to connect to the database. Please make sure MongoDB is running.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch budgets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST route to create a new budget
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    console.log('POST /api/budgets: Connecting to database');
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to the database', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database connection error' 
        },
        { status: 500 }
      );
    }

    // Parse request body
    console.log('POST /api/budgets: Parsing request body');
    const body = await req.json();

    // Validate required fields
    if (!body.category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (typeof body.amount !== 'number' || body.amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!body.month) {
      return NextResponse.json(
        { error: 'Month is required' },
        { status: 400 }
      );
    }

    // Validate month format (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(body.month)) {
      return NextResponse.json(
        { error: 'Month must be in YYYY-MM format' },
        { status: 400 }
      );
    }

    // Check for existing budget for this category and month
    console.log('POST /api/budgets: Checking for existing budget', body.category, body.month);
    const existingBudget = await Budget.findOne({
      category: body.category,
      month: body.month,
    });

    // If budget already exists, return an error
    if (existingBudget) {
      console.log('POST /api/budgets: Budget already exists for this category and month');
      return NextResponse.json(
        { error: 'A budget for this category and month already exists' },
        { status: 409 }
      );
    }

    // Create new budget
    console.log('POST /api/budgets: Creating new budget', body);
    const newBudget = await Budget.create(body);
    console.log('POST /api/budgets: Budget created successfully', newBudget);

    return NextResponse.json({ budget: newBudget }, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    
    // Check for validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }
    
    // Check for MongoDB connection errors
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      return NextResponse.json(
        { error: 'Failed to connect to the database. Please make sure MongoDB is running.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create budget', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
