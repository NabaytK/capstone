import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadPortfolio } from '../../services/storage';
import { getMultiplePrices } from '../../services/api';
import { calculateHoldings, getPortfolioTotals, EnrichedHolding } from '../../services/portfolio';
import { getCoinRisk } from '../../services/risk';
const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e' };
const fmt = (n: number) => '$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export default function Holdings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [totals, setTotals] = useState({ totalValue:0, totalCost:0, totalPL:0, totalPLPct:0 });
  const load = async () => {
    try {
      const portfolio = await loadPortfolio();
      if (!portfolio.length) { setHoldings([]); return; }
      const prices = await getMultiplePrices(portfolio.map(h => h.coinId));
      const enriched = calculateHoldings(portfolio, prices);
      setHoldings(enriched.sort((a,b) => b.currentValue - a.currentValue));
      setTotals(getPortfolioTotals(enriched));
    } finally { setLoading(false); setRefreshing(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  if (loading) return <View style={s.center}><Text style={{ color:C.sub }}>Loading...</Text></View>;
  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}>
      <Text style={s.pageTitle}>Holdings</Text>
      <View style={s.summaryRow}>
        <View style={s.summaryItem}><Text style={s.summaryLbl}>Portfolio Value</Text><Text style={s.summaryVal}>{fmt(totals.totalValue)}</Text></View>
        <View style={[s.summaryItem, { borderLeftWidth:1, borderLeftColor:C.border }]}><Text style={s.summaryLbl}>Total P/L</Text><Text style={[s.summaryVal, { color: totals.totalPL >= 0 ? C.green : C.red }]}>{totals.totalPL >= 0 ? '+' : '-'}{fmt(Math.abs(totals.totalPL))}</Text></View>
      </View>
      {holdings.length === 0 ? (
        <View style={s.center}><Text style={{ fontSize:48 }}></Text><Text style={{ color:C.text, fontSize:16, fontWeight:'700', marginTop:12 }}>No holdings yet</Text><Text style={{ color:C.sub, marginTop:6 }}>Add transactions to see your holdings</Text></View>
      ) : holdings.map(h => {
        const risk = getCoinRisk(h.change24h);
        const alloc = totals.totalValue > 0 ? (h.currentValue / totals.totalValue) * 100 : 0;
        return (
          <View key={h.coinId} style={s.card}>
            <View style={s.cardTop}>
              <View style={s.symBox}><Text style={s.sym}>{h.coinSymbol}</Text></View>
              <View style={{ flex:1 }}><Text style={s.coinName}>{h.coinName}</Text><Text style={s.coinAmt}>{h.totalAmount.toFixed(6)} coins</Text></View>
              <View style={{ alignItems:'flex-end' }}><Text style={s.coinVal}>{fmt(h.currentValue)}</Text><Text style={{ color: h.change24h >= 0 ? C.green : C.red, fontSize:12, fontWeight:'600' }}>{h.change24h >= 0 ? '' : ''} {Math.abs(h.change24h).toFixed(2)}%</Text></View>
            </View>
            <View style={s.grid}>
              <GridItem label="Price" value={'$'+h.currentPrice.toLocaleString('en-US',{maximumFractionDigits:4})} />
              <GridItem label="Avg Cost" value={'$'+h.avgCostBasis.toLocaleString('en-US',{maximumFractionDigits:4})} />
              <GridItem label="Cost Basis" value={fmt(h.totalCost)} />
              <GridItem label="P/L" value={(h.profitLoss >= 0 ? '+' : '-')+fmt(Math.abs(h.profitLoss))} valueColor={h.profitLoss >= 0 ? C.green : C.red} />
              <GridItem label="Allocation" value={alloc.toFixed(1)+'%'} />
              <View><Text style={s.gridLbl}>Risk</Text><View style={[s.badge, { borderColor:risk.color, backgroundColor:risk.color+'22' }]}><Text style={[s.badgeTxt, { color:risk.color }]}>{risk.label}</Text></View></View>
            </View>
            <View style={s.allocBar}><View style={[s.allocFill, { width: Math.min(alloc,100)+'%' }]} /></View>
          </View>
        );
      })}
      <View style={{ height:32 }} />
    </ScrollView>
  );
}
function GridItem({ label, value, valueColor }: { label:string; value:string; valueColor?:string }) {
  return <View><Text style={s.gridLbl}>{label}</Text><Text style={[s.gridVal, valueColor ? { color:valueColor } : {}]}>{value}</Text></View>;
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0a0a0f' },
  center: { alignItems:'center', justifyContent:'center', padding:40, marginTop:60 },
  pageTitle: { color:'#fff', fontSize:28, fontWeight:'800', padding:20, paddingTop:60 },
  summaryRow: { flexDirection:'row', backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:14 },
  summaryItem: { flex:1, padding:16 },
  summaryLbl: { color:'#888', fontSize:12 },
  summaryVal: { color:'#fff', fontSize:18, fontWeight:'700', marginTop:2 },
  card: { backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:16, padding:16 },
  cardTop: { flexDirection:'row', alignItems:'center', marginBottom:14 },
  symBox: { width:44, height:44, borderRadius:12, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center', marginRight:12 },
  sym: { color:'#a855f7', fontWeight:'800', fontSize:12 },
  coinName: { color:'#fff', fontWeight:'700', fontSize:15 },
  coinAmt: { color:'#888', fontSize:12, marginTop:2 },
  coinVal: { color:'#fff', fontWeight:'700', fontSize:16 },
  grid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', rowGap:12, borderTopWidth:1, borderTopColor:'#1a1a2e', paddingTop:12, marginBottom:12 },
  gridLbl: { color:'#888', fontSize:11, marginBottom:2 },
  gridVal: { color:'#fff', fontSize:13, fontWeight:'600' },
  badge: { borderWidth:1, borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  badgeTxt: { fontSize:11, fontWeight:'700' },
  allocBar: { height:4, backgroundColor:'#1a1a2e', borderRadius:2, overflow:'hidden' },
  allocFill: { height:'100%', backgroundColor:'#a855f7', borderRadius:2 },
});
