import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};
