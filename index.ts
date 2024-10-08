import { TrackerBotService } from './src/tracker-bot/trackerBot';
import { TokenModel, UserModel } from './src/tracker-bot/schemas/token';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('MONGO_URI is not defined in the environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB');

    // Initialize the bot service with the actual models
    new TrackerBotService(TokenModel, UserModel);
    console.log('Bot is running...');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
