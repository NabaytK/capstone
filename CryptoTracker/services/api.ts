const BASE = 'https://api.coingecko.com/api/v3';
const PROXY = 'https://cors-anywhere.herokuapp.com/';

export async function getMultiplePrices(ids: string[]): Promise<Record<string, any>> {
  const r = await fetch(BASE+'/simple/price?ids='+ids.join(',')+'&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
  return r.json();
}
export async function getTopMarketCoins(limit = 50): Promise<any[]> {
  const r = await fetch(BASE+'/coins/markets?vs_currency=usd&order=market_cap_desc&per_page='+limit+'&page=1&sparkline=false&price_change_percentage=24h');
  return r.json();
}
export async function getBitcoinData(): Promise<any> {
  try {
    const r = await fetch(BASE+'/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
    const d = await r.json();
    return d.bitcoin;
  } catch { return { usd: 0, usd_24h_change: 0, usd_market_cap: 0 }; }
}
export async function searchCoins(query: string): Promise<any[]> {
  const r = await fetch(BASE+'/search?query='+encodeURIComponent(query));
  const d = await r.json();
  return d.coins || [];
}
export async function getCoinMarketData(id: string): Promise<any> {
  const r = await fetch(BASE+'/coins/'+id+'?localization=false&tickers=false&community_data=false&developer_data=false');
  return r.json();
}
export async function getCryptoNews(): Promise<any[]> {
  try {
    const r = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=20');
    const d = await r.json();
    return d.Data || [];
  } catch { return []; }
}
