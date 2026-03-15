import { searchCoins } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTopMarketCoins } from '../../services/api';

const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e' };
const fmtP = (n: number) => n >= 1000 ? '$'+n.toLocaleString('en-US',{maximumFractionDigits:0}) : n >= 1 ? '$'+n.toFixed(2) : '$'+n.toFixed(6);
const fmtM = (n: number) => n >= 1e12 ? '$'+(n/1e12).toFixed(2)+'T' : n >= 1e9 ? '$'+(n/1e9).toFixed(1)+'B' : '$'+(n/1e6).toFixed(0)+'M';
const fmtN = (n: number) => n?.toLocaleString('en-US',{maximumFractionDigits:2}) || '0';

function CoinModal({ coin, onClose }: { coin: any, onClose: ()=>void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [period, setPeriod] = useState<'1'|'7'|'30'|'180'|'365'>('1');
  const PERIODS = [
    { label:'1D', value:'1' },
    { label:'5D', value:'7' },
    { label:'1M', value:'30' },
    { label:'6M', value:'180' },
    { label:'1Y', value:'365' },
  ];
  const change = coin.price_change_percentage_24h || 0;
  const color = change >= 0 ? C.green : C.red;

  const loadChart = async (days: string) => {
    setLoadingChart(true);
    try {
      const r = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${days}`
      );
      const d = await r.json();
      if (d.prices) setHistory(d.prices);
    } catch {}
    finally { setLoadingChart(false); }
  };

  useEffect(() => { loadChart(period); }, [period]);

  const PriceChart = () => {
    if (!history.length) return (
      <View style={{ height:120, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ color:'#555' }}>No chart data</Text>
      </View>
    );
    const prices = history.map((p:any) => p[1]);
    const times = history.map((p:any) => p[0]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const W = 320; const H = 120;
    const pts = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * W;
      const y = H - ((p - min) / range) * (H - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const first = prices[0];
    const last = prices[prices.length - 1];
    const chartColor = last >= first ? C.green : C.red;
    const fillPts = `0,${H} ${pts} ${W},${H}`;
    return (
      <View style={{ alignItems:'center', marginVertical:8 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={fillPts} fill="url(#grad)" />
          <path d={prices.reduce((acc, p, i) => {
              const x = (i / (prices.length - 1)) * W;
              const y = H - ((p - min) / range) * (H - 8) - 4;
              if (i === 0) return `M ${x} ${y}`;
              const px = ((i-1) / (prices.length - 1)) * W;
              const py = H - ((prices[i-1] - min) / range) * (H - 8) - 4;
              const cx1 = px + (x - px) / 3;
              const cx2 = x - (x - px) / 3;
              return acc + ` C ${cx1} ${py} ${cx2} ${y} ${x} ${y}`;
            }, '')} fill="none" stroke={chartColor} strokeWidth="2.5" />
          <circle cx={(prices.length-1)/(prices.length-1)*W} cy={H - ((last-min)/range)*(H-8)-4} r="4" fill={chartColor} />
        </svg>
        <View style={{ flexDirection:'row', justifyContent:'space-between', width:W, marginTop:4 }}>
          <Text style={{ color:'#555', fontSize:10 }}>{new Date(times[0]).toLocaleDateString()}</Text>
          <Text style={{ color:'#555', fontSize:10 }}>{new Date(times[times.length-1]).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.header}>
            <View style={m.coinIcon}>
              <Text style={{ color:C.accent, fontWeight:'900', fontSize:13 }}>{coin.symbol?.toUpperCase().slice(0,3)}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ color:'#fff', fontSize:20, fontWeight:'800' }}>{coin.name}</Text>
              <Text style={{ color:'#888', fontSize:12 }}>{coin.symbol?.toUpperCase()} · Rank #{coin.market_cap_rank}</Text>
            </View>
            <TouchableOpacity style={m.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={m.priceRow}>
            <Text style={{ color:'#fff', fontSize:34, fontWeight:'900' }}>{fmtP(coin.current_price||0)}</Text>
            <View style={[m.changeBadge, { backgroundColor: change>=0 ? '#22c55e22':'#ef444422' }]}>
              <Ionicons name={change>=0?'trending-up':'trending-down'} size={14} color={color} />
              <Text style={{ color, fontWeight:'700', fontSize:14, marginLeft:4 }}>{change>=0?'+':''}{change.toFixed(2)}% today</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Period Tabs */}
            <View style={m.periodRow}>
              {PERIODS.map(p => (
                <TouchableOpacity key={p.value} style={[m.periodBtn, period===p.value && m.periodBtnActive]} onPress={() => setPeriod(p.value as any)}>
                  <Text style={[m.periodText, period===p.value && m.periodTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            <View style={m.card}>
              {loadingChart ? (
                <View style={{ height:120, alignItems:'center', justifyContent:'center' }}>
                  <ActivityIndicator color={C.accent} />
                </View>
              ) : <PriceChart />}
            </View>

            {/* Stats */}
            <View style={m.card}>
              <Text style={m.cardTitle}>Market Stats</Text>
              <View style={m.grid}>
                {[
                  { label:'Market Cap', value: fmtM(coin.market_cap||0) },
                  { label:'24h Volume', value: fmtM(coin.total_volume||0) },
                  { label:'24h High', value: fmtP(coin.high_24h||0) },
                  { label:'24h Low', value: fmtP(coin.low_24h||0) },
                  { label:'All Time High', value: fmtP(coin.ath||0) },
                  { label:'From ATH', value: (coin.ath_change_percentage||0).toFixed(1)+'%' },
                ].map((stat, i) => (
                  <View key={i} style={m.statBox}>
                    <Text style={m.statLabel}>{stat.label}</Text>
                    <Text style={m.statValue}>{stat.value}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ height:40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function Market() {
  const [coins, setCoins] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
const [suggestions, setSuggestions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'rank'|'change'|'volume'>('rank');

  const load = async () => {
    try {
      const data = await getTopMarketCoins(100);
      const list = Array.isArray(data) ? data : [];
      setCoins(list); setFiltered(list);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = [...coins];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }
    if (sortBy === 'change') result.sort((a,b) => (b.price_change_percentage_24h||0) - (a.price_change_percentage_24h||0));
    else if (sortBy === 'volume') result.sort((a,b) => (b.total_volume||0) - (a.total_volume||0));
    setFiltered(result);
  }, [search, coins, sortBy]);

  if (loading) return (
    <View style={{ flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <Text style={s.pageTitle}>Market</Text>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#888" />
        <TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="Search coins..." placeholderTextColor="#555" />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close" size={16} color="#888" /></TouchableOpacity> : null}
      </View>

      {/* Sort Tabs */}
      <View style={s.sortRow}>
        {[['rank','By Rank'],['change','Top Movers'],['volume','By Volume']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.sortBtn, sortBy===key && s.sortBtnActive]} onPress={() => setSortBy(key as any)}>
            <Text style={[s.sortText, sortBy===key && s.sortTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        renderItem={({ item: c, index }) => (
          <TouchableOpacity style={s.row} onPress={() => setSelected(c)} activeOpacity={0.7}>
            <Text style={s.rank}>#{c.market_cap_rank || index+1}</Text>
            <View style={s.symBox}>
              <Text style={s.sym}>{c.symbol?.toUpperCase().slice(0,4)}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.name}>{c.name}</Text>
              <Text style={s.mcap}>{fmtM(c.market_cap||0)}</Text>
            </View>
            <View style={{ alignItems:'flex-end' }}>
              <Text style={s.price}>{fmtP(c.current_price||0)}</Text>
              <View style={[s.changePill, { backgroundColor: (c.price_change_percentage_24h||0)>=0 ? '#22c55e22':'#ef444422' }]}>
                <Text style={{ color:(c.price_change_percentage_24h||0)>=0?C.green:C.red, fontSize:12, fontWeight:'700' }}>
                  {(c.price_change_percentage_24h||0)>=0?'+':''}{(c.price_change_percentage_24h||0).toFixed(2)}%
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#333" style={{ marginLeft:8 }} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom:100 }}
      />

      {selected && <CoinModal coin={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const s = StyleSheet.create({
  pageTitle: { color:'#fff', fontSize:28, fontWeight:'800', padding:20, paddingTop:60, paddingBottom:12 },
  searchWrap: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#13131f', marginHorizontal:16, marginBottom:10, borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:'#1a1a2e' },
  search: { flex:1, color:'#fff', fontSize:15 },
  sortRow: { flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:12 },
  sortBtn: { paddingHorizontal:12, paddingVertical:6, borderRadius:20, backgroundColor:'#13131f', borderWidth:1, borderColor:'#1a1a2e' },
  sortBtnActive: { backgroundColor:'#a855f7', borderColor:'#a855f7' },
  sortText: { color:'#888', fontSize:12, fontWeight:'600' },
  sortTextActive: { color:'#fff' },
  row: { flexDirection:'row', alignItems:'center', backgroundColor:'#13131f', marginHorizontal:16, marginBottom:8, borderRadius:14, padding:14 },
  rank: { color:'#555', fontSize:12, width:28, fontWeight:'600' },
  symBox: { width:42, height:42, borderRadius:12, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center', marginRight:12 },
  sym: { color:'#a855f7', fontWeight:'900', fontSize:11 },
  name: { color:'#fff', fontWeight:'700', fontSize:15 },
  mcap: { color:'#888', fontSize:11, marginTop:2 },
  price: { color:'#fff', fontWeight:'800', fontSize:15 },
  changePill: { paddingHorizontal:6, paddingVertical:2, borderRadius:6, marginTop:3 },
});

const m = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'#000000aa', justifyContent:'flex-end' },
  sheet: { backgroundColor:'#0d0d1a', borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'90%' },
  handle: { width:40, height:4, backgroundColor:'#333', borderRadius:2, alignSelf:'center', marginBottom:16 },
  header: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 },
  coinIcon: { width:52, height:52, borderRadius:26, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#a855f7' },
  closeBtn: { width:36, height:36, borderRadius:18, backgroundColor:'#1a1a2e', alignItems:'center', justifyContent:'center' },
  priceRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  changeBadge: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:6, borderRadius:20 },
  card: { backgroundColor:'#13131f', borderRadius:16, padding:16, marginBottom:12 },
  cardTitle: { color:'#fff', fontSize:15, fontWeight:'800', marginBottom:12 },
  grid: { flexDirection:'row', flexWrap:'wrap', gap:12 },
  statBox: { width:'47%', backgroundColor:'#0a0a0f', borderRadius:10, padding:12 },
  statLabel: { color:'#888', fontSize:11, marginBottom:4 },
  statValue: { color:'#fff', fontSize:14, fontWeight:'700' },
  periodRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:8, backgroundColor:'#0a0a0f', borderRadius:12, padding:4 },
  periodBtn: { flex:1, paddingVertical:7, alignItems:'center', borderRadius:10 },
  periodBtnActive: { backgroundColor:'#13131f' },
  periodText: { color:'#666', fontSize:13, fontWeight:'700' },
  periodTextActive: { color:'#fff' },
});
