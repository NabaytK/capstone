import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, Switch } from 'react-native';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { clearAllData } from '../../services/storage';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', red:'#ef4444', green:'#22c55e', text:'#fff', sub:'#888', border:'#1a1a2e', input:'#0d0d1a' };

function Row({ icon, label, value, onPress, danger, toggle, toggled, onToggle }: any) {
  return (
    <TouchableOpacity style={r.row} onPress={onPress} disabled={!!toggle}>
      <View style={[r.iconBox, { backgroundColor: danger ? '#ef444422' : '#a855f722' }]}>
        <Ionicons name={icon} size={18} color={danger ? C.red : C.accent} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={[r.rowLabel, danger && { color:C.red }]}>{label}</Text>
        {value ? <Text style={r.rowValue}>{value}</Text> : null}
      </View>
      {toggle ? <Switch value={toggled} onValueChange={onToggle} trackColor={{ true:C.accent }} /> :
        onPress ? <Ionicons name="chevron-forward" size={16} color="#555" /> : null}
    </TouchableOpacity>
  );
}

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fn, setFn] = useState(''); const [ln, setLn] = useState('');
  const [phone, setPhone] = useState(''); const [uname, setUname] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [curPw, setCurPw] = useState(''); const [newPw, setNewPw] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    AsyncStorage.getItem('pref_currency').then(v => v && setCurrency(v));
    const u = auth.currentUser;
    if (u) getDoc(doc(db,'users',u.uid)).then(s => {
      if (s.exists()) {
        const d = s.data(); setProfile(d);
        setFn(d.firstName||''); setLn(d.lastName||'');
        setPhone(d.phone||''); setUname(d.username||'');
      }
    });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db,'users',u.uid), { firstName:fn, lastName:ln, phone, username:uname.toLowerCase() });
        setProfile((p:any) => ({ ...p, firstName:fn, lastName:ln, phone, username:uname.toLowerCase() }));
        setEditing(false);
        Alert.alert('Saved','Profile updated successfully!');
      }
    } catch { Alert.alert('Error','Failed to save profile'); } finally { setSaving(false); }
  };

  const changePw = async () => {
    if (!curPw || !newPw) { Alert.alert('Error','Fill in both fields'); return; }
    if (newPw.length < 8) { Alert.alert('Error','Password must be 8+ chars'); return; }
    try {
      const u = auth.currentUser;
      if (u && u.email) {
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, curPw));
        await updatePassword(u, newPw);
        setCurPw(''); setNewPw(''); setShowPw(false);
        Alert.alert('Done','Password updated!');
      }
    } catch(e:any) {
      Alert.alert('Error', e.code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Failed to update password');
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['2fa_passed','otp_code','otp_exp']);
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }}>
      <View style={{ padding:20, paddingTop:60 }}>
        <Text style={{ color:'#fff', fontSize:28, fontWeight:'800' }}>Settings</Text>
      </View>

      {/* Profile Card */}
      {profile && (
        <View style={r.profileCard}>
          <View style={r.avatar}>
            <Text style={{ color:C.accent, fontSize:24, fontWeight:'800' }}>{profile.firstName?.[0]}{profile.lastName?.[0]}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ color:'#fff', fontSize:18, fontWeight:'800' }}>{profile.firstName} {profile.lastName}</Text>
            <Text style={{ color:'#888', fontSize:13 }}>@{profile.username}</Text>
            <Text style={{ color:'#888', fontSize:13 }}>{profile.email}</Text>
          </View>
          <TouchableOpacity style={r.editBtn} onPress={() => setEditing(!editing)}>
            <Text style={{ color:C.accent, fontWeight:'700', fontSize:13 }}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Profile */}
      {editing && (
        <View style={r.section}>
          <Text style={r.sectionTitle}>EDIT PROFILE</Text>
          <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
            <TextInput style={[r.inp, { flex:1 }]} value={fn} onChangeText={setFn} placeholder="First name" placeholderTextColor="#555" />
            <TextInput style={[r.inp, { flex:1 }]} value={ln} onChangeText={setLn} placeholder="Last name" placeholderTextColor="#555" />
          </View>
          <TextInput style={[r.inp, { marginBottom:8 }]} value={uname} onChangeText={setUname} placeholder="Username" placeholderTextColor="#555" autoCapitalize="none" />
          <TextInput style={[r.inp, { marginBottom:12 }]} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#555" keyboardType="phone-pad" />
          <TouchableOpacity style={r.saveBtn} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff', fontWeight:'700' }}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Account */}
      <View style={r.section}>
        <Text style={r.sectionTitle}>ACCOUNT</Text>
        <Row icon="person-outline" label="Account Type" value="Standard" />
        <Row icon="mail-outline" label="Email Address" value={profile?.email} />
        <Row icon="call-outline" label="Phone Number" value={profile?.phone || 'Not set'} onPress={() => setEditing(true)} />
        <Row icon="shield-checkmark-outline" label="2FA Status" value="Email OTP  Enabled" />
        <Row icon="id-card-outline" label="Username" value={'@'+(profile?.username||'')} />
      </View>

      {/* Security */}
      <View style={r.section}>
        <Text style={r.sectionTitle}>SECURITY</Text>
        <Row icon="lock-closed-outline" label="Change Password" onPress={() => setShowPw(!showPw)} />
        <Row icon="finger-print-outline" label="Biometric Login" toggle toggled={biometric} onToggle={setBiometric} />
        <Row icon="eye-off-outline" label="Hide Portfolio Balance" toggle toggled={false} onToggle={() => {}} />
        {showPw && (
          <View style={{ marginTop:12, gap:8 }}>
            <TextInput style={r.inp} value={curPw} onChangeText={setCurPw} placeholder="Current password" placeholderTextColor="#555" secureTextEntry />
            <TextInput style={r.inp} value={newPw} onChangeText={setNewPw} placeholder="New password (8+ chars)" placeholderTextColor="#555" secureTextEntry />
            <TouchableOpacity style={r.saveBtn} onPress={changePw}>
              <Text style={{ color:'#fff', fontWeight:'700' }}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Preferences */}
      <View style={r.section}>
        <Text style={r.sectionTitle}>PREFERENCES</Text>
        <Row icon="notifications-outline" label="Push Notifications" toggle toggled={notifications} onToggle={setNotifications} />
        <Row icon="moon-outline" label="Dark Mode" toggle toggled={true} onToggle={() => {}} />
        <Row icon="globe-outline" label="Currency" value={currency} onPress={() => {
          const opts = ['USD','EUR','GBP','JPY','CAD','AUD'];
          const next = opts[(opts.indexOf(currency) + 1) % opts.length];
          setCurrency(next);
          AsyncStorage.setItem('pref_currency', next);
        }} />
        <Row icon="bar-chart-outline" label="Default Chart Period" value="1 Day" />
      </View>

      {/* Data */}
      <View style={r.section}>
        <Text style={r.sectionTitle}>DATA & PRIVACY</Text>
        <Row icon="download-outline" label="Export Portfolio Data" onPress={() => Alert.alert('Coming soon','Export feature coming soon')} />
        <Row icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
        <Row icon="information-circle-outline" label="Terms of Service" onPress={() => {}} />
        <Row icon="trash-outline" label="Clear All Transactions" danger onPress={() =>
          Alert.alert('Clear All Data','This will permanently delete all your transactions.',[
            { text:'Cancel' },
            { text:'Clear', style:'destructive', onPress: async () => { await clearAllData(); Alert.alert('Done','All data cleared.'); }}
          ])
        } />
      </View>

      {/* App Info */}
      <View style={r.section}>
        <Text style={r.sectionTitle}>APP</Text>
        <Row icon="information-circle-outline" label="Version" value="1.0.0" />
        <Row icon="star-outline" label="Rate the App" onPress={() => {}} />
        <Row icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
      </View>

      <TouchableOpacity style={r.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>Sign Out</Text>
      </TouchableOpacity>
      <View style={{ height:40 }} />
    </ScrollView>
  );
}
const r = StyleSheet.create({
  profileCard: { flexDirection:'row', alignItems:'center', gap:16, marginHorizontal:16, marginBottom:12, backgroundColor:'#13131f', borderRadius:16, padding:16 },
  avatar: { width:60, height:60, borderRadius:30, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center' },
  editBtn: { paddingHorizontal:12, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:'#a855f7' },
  section: { marginHorizontal:16, marginBottom:12, backgroundColor:'#13131f', borderRadius:16, padding:16 },
  sectionTitle: { color:'#555', fontSize:11, fontWeight:'700', letterSpacing:1.5, marginBottom:12 },
  row: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, borderTopWidth:1, borderTopColor:'#1a1a2e' },
  iconBox: { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  rowLabel: { color:'#fff', fontSize:15, fontWeight:'600' },
  rowValue: { color:'#888', fontSize:12, marginTop:1 },
  inp: { backgroundColor:'#0d0d1a', borderRadius:12, padding:13, color:'#fff', fontSize:14 },
  saveBtn: { backgroundColor:'#a855f7', borderRadius:12, padding:14, alignItems:'center' },
  logoutBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#ef444422', marginHorizontal:16, borderRadius:16, padding:16, marginTop:8, borderWidth:1, borderColor:'#ef444433' },
});
