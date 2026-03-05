import { EnrichedHolding } from './portfolio';

export function getCoinRisk(change24h: number): { label: string; color: string } {
  const a = Math.abs(change24h);
  if (a > 10) return { label: 'HIGH', color: '#ef4444' };
  if (a > 5)  return { label: 'MED',  color: '#f59e0b' };
  return { label: 'LOW', color: '#22c55e' };
}
export function calculatePortfolioRisk(holdings: EnrichedHolding[]): number {
  if (!holdings.length) return 0;
  const avg = holdings.reduce((s, h) => s + Math.abs(h.change24h), 0) / holdings.length;
  return Math.min(Math.round(avg * 5), 100);
}
export function calculateVaR(holdings: EnrichedHolding[], totalValue: number): number {
  if (!totalValue) return 0;
  const wv = holdings.reduce((s, h) => s + (Math.abs(h.change24h) / 100) * h.currentValue, 0);
  return (wv / totalValue) * totalValue * 1.65;
}
export function calculateDiversification(holdings: EnrichedHolding[], totalValue: number): number {
  if (!totalValue || holdings.length < 2) return 0;
  const hhi = holdings.reduce((s, h) => s + Math.pow(h.currentValue / totalValue, 2), 0);
  return Math.round((1 - hhi) * 100);
}
export function getRecommendations(holdings: EnrichedHolding[], riskScore: number, divScore: number): string[] {
  const r: string[] = [];
  if (riskScore > 70) r.push('High volatility detected. Consider adding stablecoins to reduce risk.');
  if (divScore < 40) r.push('Portfolio is heavily concentrated. Spread across more assets.');
  if (holdings.length < 3) r.push('Holding fewer than 3 assets increases risk. Consider diversifying.');
  const hasBtc = holdings.some(h => h.coinId === 'bitcoin');
  if (!hasBtc) r.push('Bitcoin is commonly used as a portfolio anchor asset.');
  if (r.length === 0) r.push('Portfolio looks well balanced. Keep monitoring market conditions.');
  return r;
}
