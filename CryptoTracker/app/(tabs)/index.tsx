import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getMultiplePrices, getBitcoinData, getTopMarketCoins } from '../../services/api';
import { loadPortfolio } from '../../services/storage';
import { calculateHoldings, getPortfolioTotals, getPortfolioAvgChange } from '../../services/portfolio';

const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e' };
const fmt = (n: number) => isNaN(n) ? '$0.00' : n >= 1000 ? '$'+n.toLocaleString('en-US',{maximumFractionDigits:0}) : '$'+n.toFixed(2);
const fmtB = (n: number) => n >= 1e12 ? '$'+(n/1e12).toFixed(2)+'T' : n >= 1e9 ? '$'+(n/1e9).toFixed(1)+'B' : '$'+(n/1e6).toFixed(0)+'M';

export default function Dashboard() {
  const [name, setName] = useState('');
  const [totals, setTotals] = useState({ value:0, pl:0, plPct:0 });
  const [btc, setBtc] = useState<any>(null);
  const [topCoins, setTopCoins] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [avgChange, setAvgChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const u = auth.currentUser;
      if (u) {
        const snap = await getDoc(doc(db,'users',u.uid));
        if (snap.exists()) setName(snap.data().firstName || '');
      }
      const [btcData, coins, port] = await Promise.all([
        getBitcoinData().catch(() => null),
        getTopMarketCoins(6).catch(() => []),
        loadPortfolio().catch(() => []),
      ]);
      setBtc(btcData);
      setTopCoins(coins);
      if (port.length > 0) {
        const prices = await getMultiplePrices(port.map((h:any) => h.coinId)).catch(() => ({}));
        const enriched = calculateHoldings(port, prices);
        const t = getPortfolioTotals(enriched);
        const avg = getPortfolioAvgChange(enriched);
        setHoldings(enriched.slice(0,3));
        setTotals({ value:t.totalValue, pl:t.totalPL, plPct:t.totalPLPct });
        setAvgChange(avg);
      }
    } catch(e) { console.error(e); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );

  return (
    <ScrollView style={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting}{name ? ', ' + name : ''}</Text>
          <Text style={s.greetingSub}>Here is your portfolio summary</Text>
        </View>
        <TouchableOpacity style={s.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Portfolio Hero Card */}
      <View style={s.heroCard}>
        <Text style={s.heroLabel}>TOTAL PORTFOLIO VALUE</Text>
        <Text style={s.heroValue}>{fmt(totals.value)}</Text>
        <View style={s.heroRow}>
          <View style={[s.badge, { backgroundColor: totals.pl >= 0 ? '#22c55e22' : '#ef444422' }]}>
            <Ionicons name={totals.pl >= 0 ? 'trending-up' : 'trending-down'} size={14} color={totals.pl >= 0 ? C.green : C.red} />
            <Text style={[s.badgeText, { color: totals.pl >= 0 ? C.green : C.red }]}>
              {totals.pl >= 0 ? '+' : ''}{fmt(totals.pl)} ({totals.plPct.toFixed(2)}%)
            </Text>
          </View>
          <Text style={{ color:'#555', fontSize:12 }}>All time P&L</Text>
        </View>
        <View style={s.heroStats}>
          <View style={s.heroStat}>
            <Text style={s.heroStatLabel}>24H CHANGE</Text>
            <Text style={[s.heroStatValue, { color: avgChange >= 0 ? C.green : C.red }]}>
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroStatLabel}>HOLDINGS</Text>
            <Text style={s.heroStatValue}>{holdings.length}</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStat}>
            <Text style={s.heroStatLabel}>COST BASIS</Text>
            <Text style={s.heroStatValue}>{fmt(totals.value - totals.pl)}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={s.quickActions}>
        {[
          { icon:'add-circle-outline', label:'Buy', route:'/(tabs)/transactions' },
          { icon:'remove-circle-outline', label:'Sell', route:'/(tabs)/transactions' },
          { icon:'swap-horizontal-outline', label:'Trade', route:'/(tabs)/transactions' },
          { icon:'bar-chart-outline', label:'Analytics', route:'/(tabs)/analytics' },
        ].map((a, i) => (
          <TouchableOpacity key={i} style={s.quickBtn} onPress={() => router.push(a.route as any)}>
            <View style={s.quickIcon}><Ionicons name={a.icon as any} size={22} color={C.accent} /></View>
            <Text style={s.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bitcoin Widget */}
      {btc && (
        <View style={s.btcCard}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
            <View style={s.btcIcon}><Text style={{ color:C.accent, fontWeight:'900', fontSize:20 }}></Text></View>
            <View>
              <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>Bitcoin</Text>
              <Text style={{ color:'#888', fontSize:12 }}>Market leader</Text>
            </View>
          </View>
          <View style={{ alignItems:'flex-end' }}>
            <Text style={{ color:'#fff', fontWeight:'900', fontSize:20 }}>{fmt(btc.usd||0)}</Text>
            <Text style={{ color:(btc.usd_24h_change||0)>=0?C.green:C.red, fontSize:13, fontWeight:'700' }}>
              {(btc.usd_24h_change||0)>=0?'+':''}{(btc.usd_24h_change||0).toFixed(2)}% today
            </Text>
          </View>
        </View>
      )}

      {/* Holdings */}
      <View style={s.section}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>My Holdings</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/holdings')} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
            <Text style={s.seeAll}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={C.accent} />
          </TouchableOpacity>
        </View>
        {holdings.length === 0 ? (
          <View style={{ alignItems:'center', paddingVertical:32, gap:10 }}>
            <View style={{ width:60, height:60, borderRadius:30, backgroundColor:'#1a1a2e', alignItems:'center', justifyContent:'center' }}>
              <Ionicons name="wallet-outline" size={28} color="#555" />
            </View>
            <Text style={{ color:'#fff', fontSize:16, fontWeight:'700' }}>No holdings yet</Text>
            <Text style={{ color:'#888', fontSize:13, textAlign:'center', lineHeight:19 }}>Start tracking your crypto portfolio by adding your first transaction</Text>
            <TouchableOpacity style={s.startBtn} onPress={() => router.push('/(tabs)/transactions')}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color:'#fff', fontWeight:'700', marginLeft:6 }}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : holdings.map((h, i) => (
          <View key={i} style={s.holdingRow}>
            <View style={s.coinBadge}><Text style={s.coinBadgeText}>{h.coinSymbol?.toUpperCase().slice(0,3)}</Text></View>
            <View style={{ flex:1 }}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:15 }}>{h.coinName}</Text>
              <Text style={{ color:'#888', fontSize:12 }}>{h.totalAmount?.toFixed(6)} {h.coinSymbol?.toUpperCase()}</Text>
            </View>
            <View style={{ alignItems:'flex-end' }}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:15 }}>{fmt(h.currentValue||0)}</Text>
              <Text style={{ color:(h.change24h||0)>=0?C.green:C.red, fontSize:12, fontWeight:'600' }}>
                {(h.change24h||0)>=0?'+':''}{(h.change24h||0).toFixed(2)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Market Summary */}
      <View style={s.section}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Market Overview</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/market')} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
            <Text style={s.seeAll}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={C.accent} />
          </TouchableOpacity>
        </View>
        {topCoins.length === 0 ? (
          <View style={{ alignItems:'center', padding:20 }}>
            <Ionicons name="trending-up-outline" size={32} color="#555" />
            <Text style={{ color:'#888', marginTop:8 }}>Market data unavailable</Text>
          </View>
        ) : topCoins.map((coin, i) => (
          <View key={i} style={s.holdingRow}>
            <View style={[s.coinBadge, { backgroundColor:'#ffffff0a' }]}>
              <Text style={[s.coinBadgeText, { fontSize:11 }]}>#{i+1}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:15 }}>{coin.name}</Text>
              <Text style={{ color:'#888', fontSize:12 }}>{coin.symbol?.toUpperCase()}  {fmtB(coin.market_cap||0)}</Text>
            </View>
            <View style={{ alignItems:'flex-end' }}>
              <Text style={{ color:'#fff', fontWeight:'700', fontSize:15 }}>{fmt(coin.current_price||0)}</Text>
              <Text style={{ color:(coin.price_change_percentage_24h||0)>=0?C.green:C.red, fontSize:12, fontWeight:'600' }}>
                {(coin.price_change_percentage_24h||0)>=0?'+':''}{(coin.price_change_percentage_24h||0).toFixed(2)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height:100 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex:1, backgroundColor:'#0a0a0f' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:60 },
  greeting: { color:'#fff', fontSize:24, fontWeight:'800' },
  greetingSub: { color:'#888', fontSize:13, marginTop:2 },
  notifBtn: { width:42, height:42, borderRadius:21, backgroundColor:'#13131f', alignItems:'center', justifyContent:'center' },
  heroCard: { marginHorizontal:16, marginBottom:16, backgroundColor:'#13131f', borderRadius:24, padding:24, borderWidth:1, borderColor:'#a855f733' },
  heroLabel: { color:'#888', fontSize:11, fontWeight:'700', letterSpacing:2, marginBottom:8 },
  heroValue: { color:'#fff', fontSize:44, fontWeight:'900', marginBottom:12 },
  heroRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  badge: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  badgeText: { fontSize:13, fontWeight:'700' },
  heroStats: { flexDirection:'row', backgroundColor:'#0a0a0f', borderRadius:14, padding:14 },
  heroStat: { flex:1, alignItems:'center' },
  heroStatLabel: { color:'#555', fontSize:10, fontWeight:'700', letterSpacing:1, marginBottom:4 },
  heroStatValue: { color:'#fff', fontSize:14, fontWeight:'800' },
  heroStatDivider: { width:1, backgroundColor:'#1a1a2e', marginVertical:4 },
  quickActions: { flexDirection:'row', marginHorizontal:16, marginBottom:16, gap:8 },
  quickBtn: { flex:1, alignItems:'center', gap:6 },
  quickIcon: { width:52, height:52, borderRadius:16, backgroundColor:'#13131f', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#1a1a2e' },
  quickLabel: { color:'#888', fontSize:12, fontWeight:'600' },
  btcCard: { marginHorizontal:16, marginBottom:16, backgroundColor:'#13131f', borderRadius:16, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  btcIcon: { width:46, height:46, borderRadius:23, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center' },
  section: { marginHorizontal:16, marginBottom:16, backgroundColor:'#13131f', borderRadius:16, padding:16 },
  sectionRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  sectionTitle: { color:'#fff', fontSize:17, fontWeight:'800' },
  seeAll: { color:'#a855f7', fontSize:13, fontWeight:'600' },
  holdingRow: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, borderTopWidth:1, borderTopColor:'#1a1a2e' },
  coinBadge: { width:46, height:46, borderRadius:23, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center' },
  coinBadgeText: { color:'#a855f7', fontSize:12, fontWeight:'800' },
  startBtn: { flexDirection:'row', alignItems:'center', backgroundColor:'#a855f7', paddingHorizontal:20, paddingVertical:12, borderRadius:12, marginTop:4 },
});
