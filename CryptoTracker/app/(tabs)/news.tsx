import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', text:'#fff', sub:'#888', border:'#1a1a2e' };

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://cryptopanic.com/api/v1/posts/?auth_token=demofeeds.feedburner.com/CoinDeskpublic=true'));
      const text = await r.text()

    const parser = new DOMParser()
    const xml = parser.parseFromString(text,"text/xml")

    const items = [...xml.querySelectorAll("item")].slice(0,20)

    const d = {Data: items.map(i => ({
      title: i.querySelector("title")?.textContent,
      url: i.querySelector("link")?.textContent,
      body: i.querySelector("description")?.textContent,
      published_on: new Date(i.querySelector("pubDate")?.textContent || "").getTime()/1000,
      source_info: {name:"CoinDesk"}
    }))};
      if (d.Data) setNews(d.Data.slice(0, 30));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = () => { setRefreshing(true); load(); };

  const timeAgo = (ts: number) => {
    const diff = Date.now()/1000 - ts;
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  };

  return (
    <ScrollView style={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
      <View style={s.header}>
        <Text style={s.title}>Crypto News</Text>
        <Text style={s.sub}>Latest from the market</Text>
      </View>
      {loading ? <ActivityIndicator color={C.accent} size="large" style={{ marginTop:60 }} /> :
        news.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="newspaper-outline" size={48} color={C.sub} />
            <Text style={{ color:'#888', fontSize:16, marginTop:12 }}>No news available</Text>
          </View>
        ) : news.map((item, i) => (
          <TouchableOpacity key={i} style={s.card} onPress={() => Linking.openURL(item.url)}>
            <View style={s.cardTop}>
              <View style={s.sourceBadge}><Text style={s.sourceText}>{item.source_info?.name || item.source}</Text></View>
              <Text style={{ color:'#888', fontSize:11 }}>{timeAgo(item.published_on)}</Text>
            </View>
            <Text style={s.newsTitle}>{item.title}</Text>
            <Text style={s.newsBody} numberOfLines={2}>{item.body}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:8 }}>
              <Text style={{ color:C.accent, fontSize:12, fontWeight:'600' }}>Read more</Text>
              <Ionicons name="arrow-forward" size={12} color={C.accent} />
            </View>
          </TouchableOpacity>
        ))
      }
      <View style={{ height:40 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex:1, backgroundColor:'#0a0a0f' },
  header: { padding:20, paddingTop:60 },
  title: { color:'#fff', fontSize:28, fontWeight:'800' },
  sub: { color:'#888', fontSize:14, marginTop:4 },
  card: { backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:16, padding:16 },
  cardTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  sourceBadge: { backgroundColor:'#a855f722', paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  sourceText: { color:'#a855f7', fontSize:11, fontWeight:'700' },
  newsTitle: { color:'#fff', fontSize:15, fontWeight:'700', marginBottom:6, lineHeight:21 },
  newsBody: { color:'#888', fontSize:13, lineHeight:19 },
  empty: { alignItems:'center', marginTop:80 },
});
