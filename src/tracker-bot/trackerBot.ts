import * as TelegramBot from 'node-telegram-bot-api';
import { Model } from 'mongoose';
import * as dotenv from 'dotenv';
import { showTransactionDetails } from './markups/transactionDetails';
import { Token, User } from './schemas/token';
import { getTimestamps, isWithinOneHour } from './utils/queryUtils';
import axios from 'axios';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;

export class TrackerBotService {
  private trackerBot: TelegramBot;

  constructor(
    private readonly TokenModel: Model<Token>,
    private readonly UserModel: Model<User>,
  ) {
    console.log('Initializing TrackerBot...');
    this.trackerBot = new TelegramBot(token, { polling: true });
    this.trackerBot.on('message', (msg) => this.handleReceivedMessages(msg));
    this.trackerBot.on('callback_query', (query) =>
      this.handleButtonCommands(query),
    );
    console.log('TrackerBot initialized and polling started.');
  }

  handleReceivedMessages = async (msg: TelegramBot.Message): Promise<void> => {
    try {
      console.log(`Received message from chat ID ${msg.chat.id}: ${msg.text}`);
      await this.trackerBot.sendChatAction(msg.chat.id, 'typing');
      if (msg.text?.trim() === '/start') {
        const welcomeMessage = `Hi @${msg.from?.username || 'User'}, welcome to MEV Wallet Tracker bot!`;
        await this.trackerBot.sendMessage(msg.chat.id, welcomeMessage, {
          parse_mode: 'Markdown',
        });
        console.log(`Sent welcome message to chat ID ${msg.chat.id}`);
      }
      await this.queryBlockchain();
    } catch (error) {
      console.error('Error in handleReceivedMessages:', error);
      await this.trackerBot.sendMessage(
        msg.chat.id,
        'Error processing your message.',
      );
    }
  };

  handleButtonCommands = async (
    query: TelegramBot.CallbackQuery,
  ): Promise<void> => {
    const chatId = query.message?.chat.id;
    const command = query.data
      ? this.isJSON(query.data)
        ? JSON.parse(query.data).command
        : query.data
      : '';
    console.log(`Received button command: ${command} from chat ID ${chatId}`);

    try {
      switch (command) {
        case '/track':
          console.log('Tracking started for user:', chatId);
          await this.trackerBot.sendChatAction(chatId, 'typing');
          const userExist = await this.UserModel.findOne({
            userChatId: chatId,
          });
          if (!userExist) {
            const savedUser = new this.UserModel({ userChatId: chatId });
            await savedUser.save();
            console.log('New user saved:', chatId);
          }
          break;
        default:
          await this.trackerBot.sendMessage(chatId, 'Unknown command.');
          console.log('Unknown command received');
      }
    } catch (error) {
      console.error('Error in handleButtonCommands:', error);
      await this.trackerBot.sendMessage(
        chatId,
        'Error processing your request.',
      );
    }
  };

  sendTransactionDetails = async (data: any): Promise<void> => {
    try {
      const allUsers = await this.UserModel.find();
      const transactionDetails = await showTransactionDetails(data);
      console.log('Sending transaction details to all users');

      for (const user of allUsers) {
        try {
          await this.trackerBot.sendMessage(
            user.userChatId,
            transactionDetails.message,
            { parse_mode: 'HTML' },
          );
        } catch (error) {
          console.error(
            `Error sending transaction details to user ${user.userChatId}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error in sendTransactionDetails:', error);
    }
  };

  queryBlockchain = async (): Promise<void> => {
    try {
      const { currentTime, sixHoursAgo } = getTimestamps();
      const body = JSON.stringify({
        query: `{
          swaps(orderBy: timestamp, orderDirection: desc, where: { sender: "0x1f2F10D1C40777AE1Da742455c65828FF36Df387", timestamp_gte: ${sixHoursAgo}, timestamp_lte: ${currentTime}, amount0In: "0" }) {
            id
            transaction { id, timestamp }
            pair { id, token0 { id, name, symbol }, createdAtTimestamp }
          }
        }`,
      });

      console.log('Querying blockchain for swaps...');
      const response = await axios.post(process.env.NODEQL_URL, body, {
        headers: { 'Content-Type': 'application/json' },
      });
      const swaps = response.data?.data?.swaps || [];
      console.log(`Fetched ${swaps.length} swaps from blockchain`);

      for (const swap of swaps) {
        if (
          isWithinOneHour(
            +swap.transaction.timestamp,
            +swap.pair.createdAtTimestamp,
          ) &&
          swap.pair.token0.id !== '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        ) {
          const tokenExist = await this.TokenModel.findOne({
            tokenPairContractAddress: swap.pair.id.toLowerCase(),
          });
          if (!tokenExist) {
            const saveToken = new this.TokenModel({
              tokenContractAddress: swap.pair.token0.id.toLowerCase(),
              tokenPairContractAddress: swap.pair.id.toLowerCase(),
              swapHashes: [swap.id],
              name: swap.pair.token0.name,
              swapsCount: 1,
              firstBuyHash: swap.transaction.id,
              firstBuyTime: swap.transaction.timestamp,
              symbol: swap.pair.token0.symbol,
            });
            await saveToken.save();
            console.log(`Saved new token: ${swap.pair.token0.name}`);
          } else if (!tokenExist.swapHashes.includes(swap.id)) {
            await this.TokenModel.findByIdAndUpdate(tokenExist._id, {
              swapsCount: tokenExist.swapsCount + 1,
              swapHashes: [...tokenExist.swapHashes, swap.id],
            });
            console.log(`Updated token ${tokenExist.name} with new swap`);
          }
        }
      }
    } catch (error) {
      console.error('Error querying blockchain:', error);
    }
  };

  private isJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}
