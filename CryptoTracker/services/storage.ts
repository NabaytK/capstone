import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  date: string;
}
export interface PortfolioHolding {
  coinId: string;
  coinSymbol: string;
  coinName: string;
  totalAmount: number;
  totalCost: number;
}

const KEY = 'txs_v1';

export async function loadTransactions(): Promise<Transaction[]> {
  try { const r = await AsyncStorage.getItem(KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
export async function addTransaction(tx: Transaction): Promise<void> {
  const all = await loadTransactions();
  all.unshift(tx);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}
export async function deleteTransaction(id: string): Promise<void> {
  const all = await loadTransactions();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter(t => t.id !== id)));
}
export async function loadPortfolio(): Promise<PortfolioHolding[]> {
  const txs = await loadTransactions();
  const map: Record<string, PortfolioHolding> = {};
  for (const tx of txs) {
    if (!map[tx.coinId]) map[tx.coinId] = { coinId: tx.coinId, coinSymbol: tx.coinSymbol, coinName: tx.coinName, totalAmount: 0, totalCost: 0 };
    if (tx.type === 'buy') { map[tx.coinId].totalAmount += tx.amount; map[tx.coinId].totalCost += tx.amount * tx.price; }
    else { map[tx.coinId].totalAmount -= tx.amount; map[tx.coinId].totalCost -= tx.amount * tx.price; }
  }
  return Object.values(map).filter(h => h.totalAmount > 0.000001);
}
export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
