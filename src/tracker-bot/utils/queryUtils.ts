export function isWithinOneHour(
  timestamp1: number,
  timestamp2: number,
): boolean {
  const oneHourInSeconds = 3600;
  return Math.abs(timestamp1 - timestamp2) <= oneHourInSeconds;
}

export function getTimestamps() {
  const currentTime = Math.floor(Date.now() / 1000);
  const sixHoursAgo = currentTime - 6 * 3600;
  return { currentTime, sixHoursAgo };
}

export function timeAgo(timestamp: number): string {
  const diffInSeconds = Math.floor(Date.now() / 1000) - timestamp;
  if (diffInSeconds < 60) return `${diffInSeconds} secs ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export const showTransactionDetails = async (data: any) => {
  const time = timeAgo(Math.abs(data.twentiethBuyTime - data.firstBuyTime));
  return {
    message: `<b>Token Alert 🚨</b>\n<b>Pair Contract Address:</b> 
<a href="https://etherscan.io/address/${data.tokenPairContractAddress}">${data.tokenPairContractAddress}</a>\n<b>Log:</b>\n<b>Token Name✅: </b>${data.name} (${data.symbol})\n<b>Time Since First Buy: </b>${time}`,
  };
};
