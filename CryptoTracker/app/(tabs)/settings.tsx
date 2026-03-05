import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { clearAllData } from '../../services/storage';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', red:'#ef4444', green:'#22c55e', text:'#fff', sub:'#888', border:'#1a1a2e', input:'#0d0d1a' };

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [phone, setPhone] = useState('');
  const [uname, setUname] = useState('');
  const [showPwSection, setShowPwSection] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (u) getDoc(doc(db,'users',u.uid)).then(s => {
      if (s.exists()) {
        const d = s.data();
        setProfile(d);
        setFn(d.firstName || ''); setLn(d.lastName || '');
        setPhone(d.phone || ''); setUname(d.username || '');
      }
    });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const u = auth.currentUser;
      if (u) {
        await updateDoc(doc(db,'users',u.uid), { firstName:fn, lastName:ln, phone, username:uname.toLowerCase() });
        setProfile((p: any) => ({ ...p, firstName:fn, lastName:ln, phone, username:uname.toLowerCase() }));
        setEditing(false);
        Alert.alert('Saved', 'Profile updated successfully!');
      }
    } catch { Alert.alert('Error', 'Failed to save profile'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!curPw || !newPw) { Alert.alert('Error','Fill in both fields'); return; }
    if (newPw.length < 8) { Alert.alert('Error','New password must be 8+ characters'); return; }
    setPwSaving(true);
    try {
      const u = auth.currentUser;
      if (u && u.email) {
        const cred = EmailAuthProvider.credential(u.email, curPw);
        await reauthenticateWithCredential(u, cred);
        await updatePassword(u, newPw);
        setCurPw(''); setNewPw(''); setShowPwSection(false);
        Alert.alert('Done', 'Password changed successfully!');
      }
    } catch (e: any) {
      if (e.code === 'auth/wrong-password') Alert.alert('Error','Current password is incorrect');
      else Alert.alert('Error','Failed to change password');
    } finally { setPwSaving(false); }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['2fa_passed','otp_code','otp_exp']);
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  const clearData = () => Alert.alert('Clear All Data','This will delete all your transactions permanently.',[
    { text:'Cancel' }, { text:'Clear', style:'destructive', onPress: async () => { await clearAllData(); Alert.alert('Done','All data cleared.'); } }
  ]);

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }}>
      <Text style={s.pageTitle}>Settings</Text>

      {profile && (
        <View style={s.card}>
          <View style={s.sectionRow}>
            <Text style={s.section}>Profile</Text>
            <TouchableOpacity onPress={() => editing ? saveProfile() : setEditing(true)} disabled={saving}>
              {saving ? <ActivityIndicator color={C.accent} size="small" /> :
                <Text style={{ color:C.accent, fontWeight:'700' }}>{editing ? 'Save' : 'Edit'}</Text>}
            </TouchableOpacity>
          </View>
          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={{ color:C.accent, fontSize:22, fontWeight:'800' }}>{profile.firstName?.[0]}{profile.lastName?.[0]}</Text>
            </View>
            <View style={{ flex:1 }}>
              {editing ? (
                <>
                  <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
                    <TextInput style={[s.inp, { flex:1 }]} value={fn} onChangeText={setFn} placeholder="First" placeholderTextColor={C.sub} />
                    <TextInput style={[s.inp, { flex:1 }]} value={ln} onChangeText={setLn} placeholder="Last" placeholderTextColor={C.sub} />
                  </View>
                  <TextInput style={[s.inp, { marginBottom:8 }]} value={uname} onChangeText={setUname} placeholder="Username" placeholderTextColor={C.sub} autoCapitalize="none" />
                  <TextInput style={s.inp} value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor={C.sub} keyboardType="phone-pad" />
                  <TouchableOpacity style={{ marginTop:8 }} onPress={() => setEditing(false)}>
                    <Text style={{ color:C.sub, fontSize:12 }}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.profileName}>{profile.firstName} {profile.lastName}</Text>
                  <Text style={{ color:C.sub, fontSize:13 }}>@{profile.username}</Text>
                  <Text style={{ color:C.sub, fontSize:13 }}>{profile.email}</Text>
                  <Text style={{ color:C.sub, fontSize:13 }}>{profile.phone}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={s.card}>
        <View style={s.sectionRow}>
          <Text style={s.section}>Security</Text>
          <TouchableOpacity onPress={() => setShowPwSection(!showPwSection)}>
            <Text style={{ color:C.accent, fontWeight:'700' }}>{showPwSection ? 'Cancel' : 'Change Password'}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.row}><Text style={{ color:C.text }}>Two-Factor Authentication</Text><Text style={{ color:C.green, fontWeight:'700' }}>Email ✓</Text></View>
        {showPwSection && (
          <>
            <TextInput style={[s.inp, { marginTop:12 }]} value={curPw} onChangeText={setCurPw} placeholder="Current password" placeholderTextColor={C.sub} secureTextEntry />
            <TextInput style={[s.inp, { marginTop:8 }]} value={newPw} onChangeText={setNewPw} placeholder="New password (8+ chars)" placeholderTextColor={C.sub} secureTextEntry />
            <TouchableOpacity style={[s.actionBtn, { marginTop:12, backgroundColor:C.accent }]} onPress={changePassword} disabled={pwSaving}>
              {pwSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff', fontWeight:'700' }}>Update Password</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.section}>Data</Text>
        <TouchableOpacity style={s.dangerBtn} onPress={clearData}>
          <Text style={{ color:C.red, fontWeight:'700' }}>🗑  Clear All Transaction Data</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={{ color:'#fff', fontWeight:'800', fontSize:16 }}>Sign Out</Text>
      </TouchableOpacity>
      <View style={{ height:40 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  pageTitle: { color:'#fff', fontSize:28, fontWeight:'800', padding:20, paddingTop:60 },
  card: { backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:16, padding:16 },
  sectionRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  section: { color:'#888', fontSize:12, fontWeight:'700', textTransform:'uppercase' },
  avatarRow: { flexDirection:'row', alignItems:'flex-start', gap:16 },
  avatar: { width:56, height:56, borderRadius:28, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center' },
  profileName: { color:'#fff', fontSize:18, fontWeight:'800' },
  row: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8 },
  inp: { backgroundColor:'#0d0d1a', borderRadius:12, padding:12, color:'#fff', fontSize:14 },
  actionBtn: { borderRadius:12, padding:14, alignItems:'center' },
  dangerBtn: { paddingVertical:12 },
  logoutBtn: { backgroundColor:'#a855f7', marginHorizontal:16, borderRadius:16, padding:16, alignItems:'center', marginTop:8 },
});
