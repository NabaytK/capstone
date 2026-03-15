import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadTransactions, addTransaction, deleteTransaction, Transaction } from '../../services/storage';
import { getTopMarketCoins } from '../../services/api';
const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e', input:'#0d0d1a' };
export default function Transactions() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [coins, setCoins] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [type, setType] = useState<'buy'|'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const load = async () => { try { setTxs(await loadTransactions()); } finally { setRefreshing(false); } };
  useFocusEffect(useCallback(() => { load(); }, []));
  const openModal = async () => {
    setModal(true); setSelected(null); setAmount(''); setPrice(''); setSearch(''); setLoadingCoins(true);
    try { const data = await getTopMarketCoins(100); setCoins(Array.isArray(data) ? data : []); }
    finally { setLoadingCoins(false); }
  };
  const save = async () => {
    if (!selected || !amount || !price) { Alert.alert('Error','Fill in all fields'); return; }
    const a = parseFloat(amount); const p = parseFloat(price);
    if (isNaN(a) || a <= 0 || isNaN(p) || p <= 0) { Alert.alert('Error','Enter valid numbers'); return; }
    setSaving(true);
    try {
      await addTransaction({ id: Date.now().toString(), coinId:selected.id, coinSymbol:selected.symbol.toUpperCase(), coinName:selected.name, type, amount:a, price:p, date:new Date().toISOString() });
      setModal(false); load();
    } finally { setSaving(false); }
  };
  const del = (id: string) => Alert.alert('Delete','Remove this transaction?',[
    { text:'Cancel' }, { text:'Delete', style:'destructive', onPress: async () => { await deleteTransaction(id); load(); } }
  ]);
  const filtered = coins.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()));
  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.accent} />}>
        <View style={s.header}><Text style={s.pageTitle}>Transactions</Text><TouchableOpacity style={s.addBtn} onPress={openModal}><Text style={{ color:'#fff', fontWeight:'800' }}>+ Add</Text></TouchableOpacity></View>
        {txs.length === 0 ? (
          <View style={s.empty}><Text style={{ fontSize:48 }}></Text><Text style={{ color:C.text, fontSize:16, fontWeight:'700', marginTop:12 }}>No transactions yet</Text><Text style={{ color:C.sub, marginTop:6 }}>Tap + Add to record your first trade</Text></View>
        ) : txs.map(tx => (
          <View key={tx.id} style={s.card}>
            <View style={{ flexDirection:'row', alignItems:'center' }}>
              <View style={[s.typeBadge, { backgroundColor: tx.type === 'buy' ? C.green+'33' : C.red+'33' }]}><Text style={{ color: tx.type === 'buy' ? C.green : C.red, fontWeight:'800', fontSize:12 }}>{tx.type.toUpperCase()}</Text></View>
              <View style={{ flex:1, marginLeft:12 }}>
                <Text style={{ color:C.text, fontWeight:'700' }}>{tx.coinName} <Text style={{ color:C.accent }}>({tx.coinSymbol})</Text></Text>
                <Text style={{ color:C.sub, fontSize:12 }}>{new Date(tx.date).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={{ color:C.text, fontWeight:'700' }}>{tx.amount} {tx.coinSymbol}</Text>
                <Text style={{ color:C.sub, fontSize:12 }}>@ ${tx.price.toLocaleString()}</Text>
              </View>
              <TouchableOpacity onPress={() => del(tx.id)} style={{ marginLeft:12 }}><Text style={{ color:C.red, fontSize:18 }}></Text></TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height:32 }} />
      </ScrollView>
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex:1, backgroundColor:C.bg }}>
          <View style={s.modalHeader}><Text style={s.pageTitle}>Add Transaction</Text><TouchableOpacity onPress={() => setModal(false)}><Text style={{ color:C.accent, fontSize:16 }}>Cancel</Text></TouchableOpacity></View>
          <ScrollView style={{ padding:16 }} keyboardShouldPersistTaps="handled">
            <View style={s.typeRow}>
              <TouchableOpacity style={[s.typeBtn, type === 'buy' && { backgroundColor:C.green }]} onPress={() => setType('buy')}><Text style={{ color: type === 'buy' ? '#000' : C.sub, fontWeight:'800' }}>BUY</Text></TouchableOpacity>
              <TouchableOpacity style={[s.typeBtn, type === 'sell' && { backgroundColor:C.red }]} onPress={() => setType('sell')}><Text style={{ color: type === 'sell' ? '#fff' : C.sub, fontWeight:'800' }}>SELL</Text></TouchableOpacity>
            </View>
            {!selected ? (
              <>
                <Text style={s.lbl}>Search Coin</Text>
                <TextInput style={s.inp} placeholder="e.g. Bitcoin, ETH..." placeholderTextColor={C.sub} value={search} onChangeText={setSearch} />
                {loadingCoins ? <ActivityIndicator color={C.accent} style={{ marginTop:20 }} /> :
                  filtered.slice(0,10).map(c => (
                    <TouchableOpacity key={c.id} style={s.coinRow} onPress={() => { setSelected(c); setPrice(c.current_price?.toString() || ''); }}>
                      <View style={[s.symBox, { width:36, height:36, marginRight:12 }]}><Text style={{ color:C.accent, fontWeight:'800', fontSize:10 }}>{c.symbol?.toUpperCase().slice(0,4)}</Text></View>
                      <Text style={{ color:C.text, flex:1, fontWeight:'600' }}>{c.name}</Text>
                      <Text style={{ color:C.sub, fontSize:13 }}>${c.current_price?.toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))
                }
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setSelected(null)} style={{ marginBottom:16 }}><Text style={{ color:C.accent }}> Change coin</Text></TouchableOpacity>
                <View style={[s.coinRow, { backgroundColor:C.card, borderRadius:12, marginBottom:16 }]}>
                  <View style={[s.symBox, { width:36, height:36, marginRight:12 }]}><Text style={{ color:C.accent, fontWeight:'800', fontSize:10 }}>{selected.symbol?.toUpperCase().slice(0,4)}</Text></View>
                  <Text style={{ color:C.text, flex:1, fontWeight:'700', fontSize:16 }}>{selected.name}</Text>
                </View>
                <Text style={s.lbl}>Amount</Text>
                <TextInput style={s.inp} placeholder="0.00" placeholderTextColor={C.sub} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
                <Text style={s.lbl}>Price per coin (USD)</Text>
                <TextInput style={s.inp} placeholder="0.00" placeholderTextColor={C.sub} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
                {amount && price ? <Text style={{ color:C.sub, marginBottom:12 }}>Total: ${(parseFloat(amount||'0') * parseFloat(price||'0')).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</Text> : null}
                <TouchableOpacity style={[s.saveBtn, saving && { opacity:0.6 }]} onPress={save} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnTxt}>Save Transaction</Text>}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:60 },
  pageTitle: { color:'#fff', fontSize:24, fontWeight:'800' },
  addBtn: { backgroundColor:'#a855f7', borderRadius:10, paddingHorizontal:16, paddingVertical:10 },
  empty: { alignItems:'center', marginTop:80 },
  card: { backgroundColor:'#13131f', marginHorizontal:16, marginBottom:10, borderRadius:14, padding:14 },
  typeBadge: { borderRadius:8, paddingHorizontal:10, paddingVertical:4 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingTop:60 },
  typeRow: { flexDirection:'row', gap:12, marginBottom:20 },
  typeBtn: { flex:1, padding:14, borderRadius:12, alignItems:'center', backgroundColor:'#13131f' },
  lbl: { color:'#888', fontSize:12, fontWeight:'600', marginBottom:8, marginTop:4 },
  inp: { backgroundColor:'#0d0d1a', borderRadius:12, padding:14, color:'#fff', fontSize:15, marginBottom:12 },
  coinRow: { flexDirection:'row', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#1a1a2e' },
  symBox: { borderRadius:10, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center' },
  saveBtn: { backgroundColor:'#a855f7', borderRadius:14, padding:16, alignItems:'center', marginTop:8 },
  saveBtnTxt: { color:'#fff', fontWeight:'800', fontSize:16 },
});
