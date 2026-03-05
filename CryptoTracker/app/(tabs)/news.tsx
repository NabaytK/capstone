import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { getCryptoNews } from '../../services/api';
const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', text:'#fff', sub:'#888', border:'#1a1a2e' };
export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => { try { setNews(await getCryptoNews()); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { load(); }, []);
  if (loading) return <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>;
  return (
    <View style={s.container}>
      <Text style={s.pageTitle}>Crypto News</Text>
      <FlatList
        data={news}
        keyExtractor={(i,idx) => i.id?.toString() || idx.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => item.url && Linking.openURL(item.url)}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
              <Text style={s.source}>{item.source_info?.name || item.source || 'News'}</Text>
              <Text style={s.time}>{new Date((item.published_on||0)*1000).toLocaleDateString()}</Text>
            </View>
            <Text style={s.title} numberOfLines={2}>{item.title}</Text>
            <Text style={s.body} numberOfLines={3}>{item.body}</Text>
            <Text style={{ color:C.accent, fontSize:12, marginTop:8 }}>Read more →</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom:32 }}
        ListEmptyComponent={<View style={s.center}><Text style={{ color:C.sub }}>No news available</Text></View>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0a0a0f' },
  center: { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#0a0a0f', padding:40 },
  pageTitle: { color:'#fff', fontSize:28, fontWeight:'800', padding:20, paddingTop:60 },
  card: { backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:16, padding:16 },
  source: { color:'#a855f7', fontSize:12, fontWeight:'700' },
  time: { color:'#888', fontSize:11 },
  title: { color:'#fff', fontSize:15, fontWeight:'700', lineHeight:22 },
  body: { color:'#888', fontSize:13, lineHeight:19, marginTop:6 },
});
