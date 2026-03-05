import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { getTopMarketCoins } from '../../services/api';
const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e' };
const fmtP = (n: number) => n >= 1000 ? '$'+n.toLocaleString('en-US',{maximumFractionDigits:0}) : n >= 1 ? '$'+n.toFixed(2) : '$'+n.toFixed(4);
const fmtM = (n: number) => n >= 1e12 ? '$'+(n/1e12).toFixed(2)+'T' : n >= 1e9 ? '$'+(n/1e9).toFixed(1)+'B' : '$'+(n/1e6).toFixed(0)+'M';
export default function Market() {
  const [coins, setCoins] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { const data = await getTopMarketCoins(100); const list = Array.isArray(data) ? data : []; setCoins(list); setFiltered(list); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!search.trim()) { setFiltered(coins); return; }
    const q = search.toLowerCase();
    setFiltered(coins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)));
  }, [search, coins]);
  if (loading) return <View style={s.center}><Text style={{ color:C.sub }}>Loading market data...</Text></View>;
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Market</Text>
      <View style={s.searchWrap}><Text style={s.searchIcon}>🔍</Text><TextInput style={s.search} value={search} onChangeText={setSearch} placeholder="Search coins..." placeholderTextColor={C.sub} /></View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        renderItem={({ item: c, index }) => (
          <View style={s.row}>
            <Text style={s.rank}>{index+1}</Text>
            <View style={s.symBox}><Text style={s.sym}>{c.symbol?.toUpperCase().slice(0,4)}</Text></View>
            <View style={{ flex:1 }}><Text style={s.name}>{c.name}</Text><Text style={s.mcap}>{fmtM(c.market_cap||0)} mcap</Text></View>
            <View style={{ alignItems:'flex-end' }}><Text style={s.price}>{fmtP(c.current_price||0)}</Text><Text style={{ color:(c.price_change_percentage_24h||0) >= 0 ? C.green : C.red, fontSize:13, fontWeight:'600' }}>{(c.price_change_percentage_24h||0) >= 0 ? '+' : ''}{(c.price_change_percentage_24h||0).toFixed(2)}%</Text></View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom:32 }}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0a0a0f' },
  center: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#0a0a0f' },
  pageTitle: { color:'#fff', fontSize:28, fontWeight:'800', padding:20, paddingTop:60 },
  searchWrap: { flexDirection:'row', alignItems:'center', backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:12, paddingHorizontal:14 },
  searchIcon: { fontSize:16, marginRight:8 },
  search: { flex:1, color:'#fff', padding:12, fontSize:15 },
  row: { flexDirection:'row', alignItems:'center', backgroundColor:'#13131f', marginHorizontal:16, marginBottom:8, borderRadius:12, padding:12 },
  rank: { color:'#555', fontSize:12, width:24 },
  symBox: { width:40, height:40, borderRadius:10, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center', marginRight:12 },
  sym: { color:'#a855f7', fontWeight:'800', fontSize:11 },
  name: { color:'#fff', fontWeight:'700', fontSize:14 },
  mcap: { color:'#888', fontSize:11, marginTop:2 },
  price: { color:'#fff', fontWeight:'700', fontSize:15 },
});
