import { Schema, model, Document } from 'mongoose';

// Define TypeScript interface for Token schema
export interface Token extends Document {
  tokenContractAddress: string;
  tokenPairContractAddress: string;
  swapHashes: string[];
  name: string;
  swapsCount: number;
  tokenAge: string;
  firstBuyHash: string;
  firstBuyTime: string;
  twentiethBuyHash?: string;
  twentiethBuyTime?: string;
  symbol: string;
}

// Define TypeScript interface for User schema
export interface User extends Document {
  userChatId: number;
}

const tokenSchema = new Schema<Token>({
  tokenContractAddress: { type: String, required: true },
  tokenPairContractAddress: { type: String, required: true },
  swapHashes: [String],
  name: String,
  swapsCount: Number,
  tokenAge: String,
  firstBuyHash: String,
  firstBuyTime: String,
  twentiethBuyHash: String,
  twentiethBuyTime: String,
  symbol: String,
});

const userSchema = new Schema<User>({
  userChatId: { type: Number, unique: true },
});

export const TokenModel = model<Token>('Token', tokenSchema);
export const UserModel = model<User>('User', userSchema);
