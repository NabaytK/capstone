import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { loadPortfolio } from '../../services/storage';
import { getMultiplePrices, getBitcoinData, getTopMarketCoins } from '../../services/api';
import { calculateHoldings, getPortfolioTotals, getPortfolioAvgChange } from '../../services/portfolio';
import { auth } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', accent2:'#7c3aed', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e' };
const fmt = (n: number) => '$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [totals, setTotals] = useState({ totalValue:0, totalCost:0, totalPL:0, totalPLPct:0 });
  const [avgChange, setAvgChange] = useState(0);
  const [topHoldings, setTopHoldings] = useState<any[]>([]);
  const [btc, setBtc] = useState<any>(null);
  const [market, setMarket] = useState<any[]>([]);
  const load = async () => {
    try {
      const u = auth.currentUser;
      if (u) { const snap = await getDoc(doc(db,'users',u.uid)); if(snap.exists()) setName(snap.data().firstName); }
      const [portfolio, btcData, marketData] = await Promise.all([loadPortfolio(), getBitcoinData(), getTopMarketCoins(5)]);
      setBtc(btcData); setMarket(Array.isArray(marketData) ? marketData : []);
      if (portfolio.length) {
        const prices = await getMultiplePrices(portfolio.map(h => h.coinId));
        const enriched = calculateHoldings(portfolio, prices);
        setTotals(getPortfolioTotals(enriched));
        setAvgChange(getPortfolioAvgChange(enriched));
        setTopHoldings(enriched.sort((a,b) => b.currentValue - a.currentValue).slice(0,3));
      }
    } finally { setRefreshing(false); }
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  const plColor = totals.totalPL >= 0 ? C.green : C.red;
  const acColor = avgChange >= 0 ? C.green : C.red;
  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}>
      <View style={s.header}>
        <View><Text style={s.greeting}>Good day{name ? ', '+name : ''} 👋</Text><Text style={s.sub}>Your portfolio overview</Text></View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/(tabs)/transactions')}><Text style={{ color:'#fff', fontWeight:'800', fontSize:20 }}>+</Text></TouchableOpacity>
      </View>
      <View style={s.heroCard}>
        <Text style={s.heroLabel}>Total Portfolio Value</Text>
        <Text style={s.heroValue}>{fmt(totals.totalValue)}</Text>
        <View style={{ flexDirection:'row', gap:16, marginTop:8 }}>
          <View style={[s.chip, { backgroundColor: plColor+'22' }]}><Text style={{ color:plColor, fontWeight:'700', fontSize:13 }}>{totals.totalPL >= 0 ? '▲' : '▼'} {fmt(Math.abs(totals.totalPL))} ({totals.totalPLPct.toFixed(2)}%)</Text></View>
          <View style={[s.chip, { backgroundColor: acColor+'22' }]}><Text style={{ color:acColor, fontWeight:'700', fontSize:13 }}>24h {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%</Text></View>
        </View>
      </View>
      {btc && (
        <View style={s.btcCard}>
          <View><Text style={s.btcLabel}>₿ Bitcoin</Text><Text style={s.btcPrice}>{fmt(btc.usd)}</Text></View>
          <View style={{ alignItems:'flex-end' }}>
            <Text style={{ color: btc.usd_24h_change >= 0 ? C.green : C.red, fontWeight:'700', fontSize:16 }}>{btc.usd_24h_change >= 0 ? '▲' : '▼'} {Math.abs(btc.usd_24h_change).toFixed(2)}%</Text>
            <Text style={{ color:C.sub, fontSize:12 }}>Mkt Cap: ${(btc.usd_market_cap/1e9).toFixed(0)}B</Text>
          </View>
        </View>
      )}
      {topHoldings.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top Holdings</Text>
          {topHoldings.map(h => (
            <View key={h.coinId} style={s.holdingRow}>
              <View style={s.symbolBox}><Text style={{ color:C.accent, fontWeight:'800', fontSize:12 }}>{h.coinSymbol}</Text></View>
              <View style={{ flex:1 }}><Text style={{ color:C.text, fontWeight:'700' }}>{h.coinName}</Text><Text style={{ color:C.sub, fontSize:12 }}>{h.totalAmount.toFixed(4)} coins</Text></View>
              <View style={{ alignItems:'flex-end' }}><Text style={{ color:C.text, fontWeight:'700' }}>{fmt(h.currentValue)}</Text><Text style={{ color: h.change24h >= 0 ? C.green : C.red, fontSize:12 }}>{h.change24h >= 0 ? '+' : ''}{h.change24h.toFixed(2)}%</Text></View>
            </View>
          ))}
        </View>
      )}
      {market.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Market Summary</Text>
          {market.map(c => (
            <View key={c.id} style={s.holdingRow}>
              <View style={s.symbolBox}><Text style={{ color:C.accent, fontWeight:'800', fontSize:11 }}>{c.symbol?.toUpperCase()}</Text></View>
              <View style={{ flex:1 }}><Text style={{ color:C.text, fontWeight:'600' }}>{c.name}</Text><Text style={{ color:C.sub, fontSize:11 }}>${(c.market_cap/1e9).toFixed(1)}B mcap</Text></View>
              <View style={{ alignItems:'flex-end' }}><Text style={{ color:C.text, fontWeight:'700' }}>${c.current_price?.toLocaleString()}</Text><Text style={{ color: (c.price_change_percentage_24h||0) >= 0 ? C.green : C.red, fontSize:12 }}>{(c.price_change_percentage_24h||0) >= 0 ? '+' : ''}{(c.price_change_percentage_24h||0).toFixed(2)}%</Text></View>
            </View>
          ))}
        </View>
      )}
      {totals.totalValue === 0 && (
        <View style={s.empty}><Text style={{ fontSize:48 }}>🚀</Text><Text style={{ color:C.text, fontSize:18, fontWeight:'800', marginTop:16 }}>Start Tracking</Text><Text style={{ color:C.sub, marginTop:8, textAlign:'center' }}>Add your first transaction to see your portfolio here</Text><TouchableOpacity style={[s.addBtn, { marginTop:20, paddingHorizontal:24, paddingVertical:12, borderRadius:12 }]} onPress={() => router.push('/(tabs)/transactions')}><Text style={{ color:'#fff', fontWeight:'800' }}>Add Transaction</Text></TouchableOpacity></View>
      )}
      <View style={{ height:32 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0a0a0f' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:60 },
  greeting: { color:'#fff', fontSize:22, fontWeight:'800' },
  sub: { color:'#888', fontSize:13, marginTop:2 },
  addBtn: { backgroundColor:'#a855f7', width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center' },
  heroCard: { margin:16, padding:24, borderRadius:20, backgroundColor:'#13131f', borderWidth:1, borderColor:'#2a1a4e' },
  heroLabel: { color:'#888', fontSize:13 },
  heroValue: { color:'#fff', fontSize:36, fontWeight:'900', marginTop:4 },
  chip: { borderRadius:8, paddingHorizontal:10, paddingVertical:4 },
  btcCard: { marginHorizontal:16, marginBottom:8, padding:18, borderRadius:16, backgroundColor:'#13131f', flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  btcLabel: { color:'#888', fontSize:12 },
  btcPrice: { color:'#fff', fontSize:22, fontWeight:'800' },
  section: { margin:16, marginTop:8 },
  sectionTitle: { color:'#fff', fontSize:16, fontWeight:'800', marginBottom:10 },
  holdingRow: { flexDirection:'row', alignItems:'center', backgroundColor:'#13131f', borderRadius:12, padding:12, marginBottom:8 },
  symbolBox: { width:40, height:40, borderRadius:10, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center', marginRight:12 },
  empty: { alignItems:'center', padding:40, marginTop:20 },
});
