import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadPortfolio } from '../../services/storage';
import { getMultiplePrices, getBitcoinData } from '../../services/api';
import { calculateHoldings, getPortfolioTotals, EnrichedHolding } from '../../services/portfolio';
import { calculatePortfolioRisk, calculateVaR, calculateDiversification, getRecommendations } from '../../services/risk';
const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e' };
const fmt = (n: number) => '$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const W = Dimensions.get('window').width - 64;
const PIE_COLORS = ['#a855f7','#7c3aed','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#8b5cf6'];
function PieChart({ holdings, totalValue }: { holdings: EnrichedHolding[], totalValue: number }) {
  if (!holdings.length || !totalValue) return null;
  const size = 160; const cx = size/2; const cy = size/2; const r = 60; const inner = 35;
  let angle = -Math.PI / 2;
  const slices = holdings.slice(0,8).map((h, i) => {
    const pct = h.currentValue / totalValue;
    const a1 = angle; const a2 = angle + pct * 2 * Math.PI; angle = a2;
    const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2); const y2 = cy + r * Math.sin(a2);
    const xi1 = cx + inner * Math.cos(a1); const yi1 = cy + inner * Math.sin(a1);
    const xi2 = cx + inner * Math.cos(a2); const yi2 = cy + inner * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    return { path: `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`, color: PIE_COLORS[i % PIE_COLORS.length], symbol: h.coinSymbol, pct: (pct*100).toFixed(1) };
  });
  return (
    <View style={{ alignItems:'center', marginVertical:16 }}>
      <View style={{ width:size, height:size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((sl,i) => <path key={i} d={sl.path} fill={sl.color} />)}
        </svg>
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:8, marginTop:12 }}>
        {slices.map((sl,i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
            <View style={{ width:10, height:10, borderRadius:5, backgroundColor:sl.color }} />
            <Text style={{ color:C.sub, fontSize:11 }}>{sl.symbol} {sl.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [totals, setTotals] = useState({ totalValue:0, totalCost:0, totalPL:0, totalPLPct:0 });
  const [btc, setBtc] = useState<any>(null);
  const load = async () => {
    try {
      const [portfolio, btcData] = await Promise.all([loadPortfolio(), getBitcoinData()]);
      setBtc(btcData);
      if (portfolio.length) {
        const prices = await getMultiplePrices(portfolio.map(h => h.coinId));
        const enriched = calculateHoldings(portfolio, prices);
        setHoldings(enriched); setTotals(getPortfolioTotals(enriched));
      }
    } finally { setLoading(false); setRefreshing(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  if (loading) return <View style={s.center}><Text style={{ color:C.sub }}>Loading analytics...</Text></View>;
  const riskScore = calculatePortfolioRisk(holdings);
  const varVal = calculateVaR(holdings, totals.totalValue);
  const divScore = calculateDiversification(holdings, totals.totalValue);
  const recs = getRecommendations(holdings, riskScore, divScore);
  const riskColor = riskScore > 70 ? C.red : riskScore > 40 ? '#f59e0b' : C.green;
  const btcReturn = btc ? btc.usd_24h_change : 0;
  const portReturn = totals.totalCost > 0 ? ((totals.totalValue - totals.totalCost) / totals.totalCost) * 100 : 0;
  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}>
      <Text style={s.pageTitle}>Analytics</Text>
      <View style={s.row2}>
        <View style={[s.statCard, { flex:1 }]}><Text style={s.statLbl}>Risk Score</Text><Text style={[s.statVal, { color:riskColor }]}>{riskScore}</Text><Text style={s.statSub}>/100</Text></View>
        <View style={[s.statCard, { flex:1 }]}><Text style={s.statLbl}>Diversification</Text><Text style={[s.statVal, { color:C.accent }]}>{divScore}</Text><Text style={s.statSub}>/100</Text></View>
      </View>
      <View style={s.row2}>
        <View style={[s.statCard, { flex:1 }]}><Text style={s.statLbl}>Value at Risk</Text><Text style={[s.statVal, { color:C.red }]}>{fmt(varVal)}</Text><Text style={s.statSub}>95% confidence</Text></View>
        <View style={[s.statCard, { flex:1 }]}><Text style={s.statLbl}>Total Return</Text><Text style={[s.statVal, { color: portReturn >= 0 ? C.green : C.red }]}>{portReturn >= 0 ? '+' : ''}{portReturn.toFixed(2)}%</Text><Text style={s.statSub}>vs cost basis</Text></View>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Portfolio Allocation</Text>
        {holdings.length > 0 ? <PieChart holdings={holdings} totalValue={totals.totalValue} /> : <Text style={{ color:C.sub, textAlign:'center', padding:20 }}>No holdings to display</Text>}
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>vs Bitcoin Benchmark</Text>
        <View style={s.benchRow}>
          <View style={s.benchItem}><Text style={s.benchLbl}>Your Portfolio</Text><Text style={[s.benchVal, { color: portReturn >= 0 ? C.green : C.red }]}>{portReturn >= 0 ? '+' : ''}{portReturn.toFixed(2)}%</Text></View>
          <View style={s.benchDivider} />
          <View style={s.benchItem}><Text style={s.benchLbl}>Bitcoin 24h</Text><Text style={[s.benchVal, { color: btcReturn >= 0 ? C.green : C.red }]}>{btcReturn >= 0 ? '+' : ''}{btcReturn.toFixed(2)}%</Text></View>
        </View>
        <View style={s.riskBarWrap}><View style={[s.riskBar, { width: riskScore+'%', backgroundColor:riskColor }]} /></View>
        <Text style={{ color:C.sub, fontSize:11, marginTop:4 }}>Portfolio Risk Level: {riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low'}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>AI Recommendations</Text>
        {recs.map((r,i) => <View key={i} style={s.recItem}><Text style={{ color:C.accent, marginRight:8 }}>◈</Text><Text style={{ color:C.text, flex:1, fontSize:14, lineHeight:20 }}>{r}</Text></View>)}
      </View>
      <View style={{ height:32 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0a0a0f' },
  center: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#0a0a0f' },
  pageTitle: { color:'#fff', fontSize:28, fontWeight:'800', padding:20, paddingTop:60 },
  row2: { flexDirection:'row', gap:12, marginHorizontal:16, marginBottom:12 },
  statCard: { backgroundColor:'#13131f', borderRadius:14, padding:16 },
  statLbl: { color:'#888', fontSize:12, marginBottom:4 },
  statVal: { fontSize:28, fontWeight:'900' },
  statSub: { color:'#888', fontSize:11, marginTop:2 },
  card: { backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:16, padding:16 },
  cardTitle: { color:'#fff', fontSize:16, fontWeight:'800', marginBottom:12 },
  benchRow: { flexDirection:'row', alignItems:'center' },
  benchItem: { flex:1, alignItems:'center', padding:12 },
  benchLbl: { color:'#888', fontSize:12, marginBottom:4 },
  benchVal: { fontSize:22, fontWeight:'800' },
  benchDivider: { width:1, height:40, backgroundColor:'#1a1a2e' },
  riskBarWrap: { height:6, backgroundColor:'#1a1a2e', borderRadius:3, overflow:'hidden', marginTop:12 },
  riskBar: { height:'100%', borderRadius:3 },
  recItem: { flexDirection:'row', alignItems:'flex-start', marginBottom:12, paddingBottom:12, borderBottomWidth:1, borderBottomColor:'#1a1a2e' },
});
