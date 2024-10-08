// import * as TelegramBot from 'node-telegram-bot-api';
// import { Model } from 'mongoose';
// import * as dotenv from 'dotenv';
// import { showTransactionDetails } from '../src/tracker-bot/markups';
// import { getTimestamps, isWithinOneHour } from './tracker-bot/utils/queryUtils';
// import { Token, User } from './tracker-bot/schemas/token';
// import axios from 'axios';

// dotenv.config();

// const token = process.env.TELEGRAM_TOKEN;

// export class TrackerBotService {
//   private trackerBot: TelegramBot;

//   constructor(
//     private readonly TokenModel: Model<Token>,
//     private readonly UserModel: Model<User>,
//   ) {
//     this.trackerBot = new TelegramBot(token, { polling: true });
//     this.trackerBot.on('message', this.handleReceivedMessages);
//     this.trackerBot.on('callback_query', this.handleButtonCommands);
//   }

//   handleReceivedMessages = async (msg: TelegramBot.Message): Promise<void> => {
//     try {
//       await this.trackerBot.sendChatAction(msg.chat.id, 'typing');
//       if (msg.text?.trim() === '/start') {
//         const welcomeMessage = `Hi @${msg.from?.username || 'User'}, welcome to MEV Wallet Tracker bot!`;
//         await this.trackerBot.sendMessage(msg.chat.id, welcomeMessage, {
//           parse_mode: 'Markdown',
//         });
//       }
//     } catch (error) {
//       await this.trackerBot.sendMessage(
//         msg.chat.id,
//         'Error processing your message.',
//       );
//       console.error(error);
//     }
//   };

//   handleButtonCommands = async (
//     query: TelegramBot.CallbackQuery,
//   ): Promise<void> => {
//     const chatId = query.message?.chat.id;
//     let command: string = '';

//     try {
//       command = query.data
//         ? this.isJSON(query.data)
//           ? JSON.parse(query.data).command
//           : query.data
//         : '';
//       if (command === '/track') {
//         const userExist = await this.UserModel.findOne({ userChatId: chatId });
//         if (!userExist) {
//           const savedUser = new this.UserModel({ userChatId: chatId });
//           await savedUser.save();
//         }
//       } else {
//         await this.trackerBot.sendMessage(chatId, 'Unknown command.');
//       }
//     } catch (error) {
//       await this.trackerBot.sendMessage(
//         chatId,
//         'Error processing your request.',
//       );
//       console.error(error);
//     }
//   };

//   sendTransactionDetails = async (data: any): Promise<void> => {
//     try {
//       const allUsers = await this.UserModel.find();
//       const transactionDetails = await showTransactionDetails(data);

//       for (const user of allUsers) {
//         try {
//           await this.trackerBot.sendMessage(
//             user.userChatId,
//             transactionDetails.message,
//             { parse_mode: 'HTML' },
//           );
//         } catch (error) {
//           console.error(error);
//         }
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   queryBlockchain = async (): Promise<void> => {
//     try {
//       const { currentTime, sixHoursAgo } = getTimestamps();
//       const body = JSON.stringify({
//         query: `{
//           swaps(orderBy: timestamp, orderDirection: desc, where: { sender: "0x1f2F10D1C40777AE1Da742455c65828FF36Df387", timestamp_gte: ${sixHoursAgo}, timestamp_lte: ${currentTime}, amount0In: "0" }) {
//             id
//             transaction { id, timestamp }
//             pair { id, token0 { id, name, symbol }, createdAtTimestamp }
//           }
//         }`,
//       });
//       const response = await axios.post(process.env.NODEQL_URL, body, {
//         headers: { 'Content-Type': 'application/json' },
//       });
//       const swaps = response.data?.data?.swaps || [];

//       for (const swap of swaps) {
//         if (
//           isWithinOneHour(
//             +swap.transaction.timestamp,
//             +swap.pair.createdAtTimestamp,
//           )
//         ) {
//           const tokenExist = await this.TokenModel.findOne({
//             tokenPairContractAddress: swap.pair.id.toLowerCase(),
//           });
//           if (!tokenExist) {
//             const saveToken = new this.TokenModel({
//               tokenContractAddress: swap.pair.token0.id.toLowerCase(),
//               tokenPairContractAddress: swap.pair.id.toLowerCase(),
//               swapHashes: [swap.id],
//               name: swap.pair.token0.name,
//               swapsCount: 1,
//               firstBuyHash: swap.transaction.id,
//               firstBuyTime: swap.transaction.timestamp,
//               symbol: swap.pair.token0.symbol,
//             });
//             await saveToken.save();
//           } else if (!tokenExist.swapHashes.includes(swap.id)) {
//             await this.TokenModel.findByIdAndUpdate(tokenExist._id, {
//               swapsCount: tokenExist.swapsCount + 1,
//               swapHashes: [...tokenExist.swapHashes, swap.id],
//             });
//           }
//         }
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   private isJSON(str: string): boolean {
//     try {
//       JSON.parse(str);
//       return true;
//     } catch {
//       return false;
//     }
//   }
// }
