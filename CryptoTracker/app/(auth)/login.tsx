import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import emailjs from '@emailjs/browser';

const C = { bg:'#0a0a0f', card:'#13131f', border:'#2a2a3e', accent:'#a855f7', accent2:'#7c3aed', text:'#fff', sub:'#888', input:'#0d0d1a', green:'#22c55e', red:'#ef4444' };

type Step = 'login' | 'signup' | 'twofa';

function PwBar({ pw }: { pw: string }) {
  if (!pw) return null;
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = checks.filter(Boolean).length;
  const col = score <= 1 ? C.red : score <= 2 ? '#f59e0b' : score === 3 ? '#3b82f6' : C.green;
  const label = ['','Weak','Fair','Good','Strong'][score];
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection:'row', gap:4, marginBottom:4 }}>
        {[1,2,3,4].map(i => <View key={i} style={{ flex:1, height:3, borderRadius:2, backgroundColor: i<=score ? col : C.border }} />)}
      </View>
      <Text style={{ color:col, fontSize:11, fontWeight:'700' }}>{label}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [otpSent, setOtpSent] = useState('');

  // login fields
  const [lemail, setLemail] = useState('');
  const otpEmailRef = useRef('');
  const [lpw, setLpw] = useState('');

  // signup fields
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [uname, setUname] = useState('');
  const [phone, setPhone] = useState('');
  const [semail, setSemail] = useState('');
  const [spw, setSpw] = useState('');
  const [spw2, setSpw2] = useState('');

  // 2fa
  const [otp, setOtp] = useState('');

  const clear = () => setErr('');

  const sendOtp = async (toEmail: string = '') => {
    if (!toEmail) toEmail = otpEmailRef.current;
    console.log('SENDOTP CALLED WITH EMAIL:', toEmail);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await AsyncStorage.setItem('otp_code', code);
    await AsyncStorage.setItem('otp_exp', (Date.now() + 10 * 60 * 1000).toString());
    setOtpSent(code);
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_epsfiep',
          template_id: 'template_at6bqhg',
          user_id: 'c1JbjPDxxR7BOCaLp',
          template_params: {
            passcode: code,
            to_email: toEmail,
          }
        })
      });
      console.log('EmailJS response:', res.status, await res.text());
    } catch(e) { console.error('EmailJS error:', e); }
  };

  const doLogin = async () => {
    otpEmailRef.current = lemail.trim();
    clear();
    if (!lemail.trim() || !lpw) { setErr('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, otpEmailRef.current, lpw);
      await sendOtp(otpEmailRef.current);
      setOtp('');
      setStep('twofa');
    } catch (e: any) {
      const c = e.code || '';
      if (c === 'auth/invalid-credential' || c === 'auth/wrong-password') setErr('Wrong email or password.');
      else if (c === 'auth/user-not-found') setErr('No account found with that email.');
      else if (c === 'auth/too-many-requests') setErr('Too many attempts. Please wait.');
      else setErr('Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const doSignup = async () => {
    clear();
    if (!fn.trim() || !ln.trim() || !uname.trim() || !semail.trim() || !spw || !spw2 || !phone.trim()) { setErr('Please fill in all fields'); return; }
    if (spw !== spw2) { setErr('Passwords do not match'); return; }
    if (spw.length < 8 || !/[A-Z]/.test(spw) || !/[0-9]/.test(spw) || !/[^A-Za-z0-9]/.test(spw)) { setErr('Password needs 8+ chars, uppercase, number and symbol'); return; }
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('username', '==', uname.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) { setErr('Username already taken'); setLoading(false); return; }
      const cred = await createUserWithEmailAndPassword(auth, semail.trim(), spw);
      await updateProfile(cred.user, { displayName: fn.trim() + ' ' + ln.trim() });
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: fn.trim(), lastName: ln.trim(),
        username: uname.toLowerCase().trim(),
        email: semail.toLowerCase().trim(),
        phone: phone.trim(),
        createdAt: new Date().toISOString(),
      });
      console.log('DOLOGIN - lemail is:', lemail.trim());
      await sendOtp(semail.trim());
      setOtp('');
      setStep('twofa');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') setErr('Email already registered. Please login.');
      else setErr(e.message || e.code || 'Signup failed: '+JSON.stringify(e));
    } finally { setLoading(false); }
  };

  const doVerify = async () => {
    clear();
    if (otp.length !== 6) { setErr('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem('otp_code');
      const exp = parseInt(await AsyncStorage.getItem('otp_exp') || '0');
      if (Date.now() > exp) { setErr('Code expired. Go back and try again.'); setLoading(false); return; }
      if (otp.trim() !== saved) { setErr('Incorrect code. Try again.'); setLoading(false); return; }
      await AsyncStorage.multiRemove(['otp_code', 'otp_exp']);
      await AsyncStorage.setItem('2fa_passed', 'true');
      router.replace('/(tabs)');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:C.bg }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <Ionicons name="eye-outline" size={20} color="#888" />
          <Text style={s.logoTitle}>CryptoTracker</Text>
          <Text style={s.logoSub}>Secure Portfolio Manager</Text>
        </View>

        {step === 'login' && (
          <View style={s.card}>
            <View style={s.tabRow}>
              <TouchableOpacity style={[s.tab, s.tabActive]}><Text style={[s.tabTxt, { color:'#000' }]}>Login</Text></TouchableOpacity>
              <TouchableOpacity style={s.tab} onPress={() => { clear(); setStep('signup'); }}><Text style={s.tabTxt}>Sign Up</Text></TouchableOpacity>
            </View>
            {!!err && <View style={s.errBox}><Text style={s.errTxt}> {err}</Text></View>}
            <Text style={s.lbl}>Email</Text>
            <TextInput style={s.inp} value={lemail} onChangeText={setLemail} placeholder="your@email.com" placeholderTextColor={C.sub} keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.lbl}>Password</Text>
            <View style={s.pwRow}>
              <TextInput style={[s.inp, { flex:1 }]} value={lpw} onChangeText={setLpw} placeholder="Password" placeholderTextColor={C.sub} secureTextEntry={!showPw} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(!showPw)}><Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color="#888" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.btn, loading && { opacity:0.6 }]} onPress={doLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign In </Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems:'center', marginTop:16 }} onPress={() => { clear(); setStep('signup'); }}>
              <Text style={{ color:C.sub }}>No account? <Text style={{ color:C.accent, fontWeight:'700' }}>Create one </Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'signup' && (
          <View style={s.card}>
            <View style={s.tabRow}>
              <TouchableOpacity style={s.tab} onPress={() => { clear(); setStep('login'); }}><Text style={s.tabTxt}>Login</Text></TouchableOpacity>
              <TouchableOpacity style={[s.tab, s.tabActive]}><Text style={[s.tabTxt, { color:'#000' }]}>Sign Up</Text></TouchableOpacity>
            </View>
            {!!err && <View style={s.errBox}><Text style={s.errTxt}> {err}</Text></View>}
            <View style={{ flexDirection:'row', gap:10 }}>
              <View style={{ flex:1 }}><Text style={s.lbl}>First Name</Text><TextInput style={s.inp} value={fn} onChangeText={setFn} placeholder="First" placeholderTextColor={C.sub} /></View>
              <View style={{ flex:1 }}><Text style={s.lbl}>Last Name</Text><TextInput style={s.inp} value={ln} onChangeText={setLn} placeholder="Last" placeholderTextColor={C.sub} /></View>
            </View>
            <Text style={s.lbl}>Username</Text>
            <TextInput style={s.inp} value={uname} onChangeText={setUname} placeholder="choose_username" placeholderTextColor={C.sub} autoCapitalize="none" autoCorrect={false} />
            <Text style={s.lbl}>Email</Text>
            <TextInput style={s.inp} value={semail} onChangeText={setSemail} placeholder="your@email.com" placeholderTextColor={C.sub} keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.lbl}>Phone</Text>
            <TextInput style={s.inp} value={phone} onChangeText={setPhone} placeholder="+1 555 000 0000" placeholderTextColor={C.sub} keyboardType="phone-pad" />
            <Text style={s.lbl}>Password</Text>
            <View style={s.pwRow}>
              <TextInput style={[s.inp, { flex:1 }]} value={spw} onChangeText={setSpw} placeholder="Strong password" placeholderTextColor={C.sub} secureTextEntry={!showPw} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(!showPw)}><Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color="#888" /></TouchableOpacity>
            </View>
            <PwBar pw={spw} />
            <Text style={s.lbl}>Confirm Password</Text>
            <TextInput style={[s.inp, spw2.length > 0 && spw !== spw2 ? { borderWidth:1, borderColor:C.red } : {}]} value={spw2} onChangeText={setSpw2} placeholder="Repeat password" placeholderTextColor={C.sub} secureTextEntry={!showPw} />
            <TouchableOpacity style={[s.btn, { marginTop:16 }, loading && { opacity:0.6 }]} onPress={doSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Create Account </Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'twofa' && (
          <View style={s.card}>
            <Ionicons name="eye-outline" size={20} color="#888" />
            <Text style={[s.logoTitle, { textAlign:'center', marginBottom:8 }]}>Verify It's You</Text>
            <Text style={{ color:C.sub, textAlign:'center', marginBottom:24 }}>Enter the 6-digit code sent to your email</Text>
            {!!err && <View style={s.errBox}><Text style={s.errTxt}> {err}</Text></View>}
            <TextInput
              style={[s.inp, { textAlign:'center', fontSize:32, fontWeight:'800', letterSpacing:12, paddingVertical:20 }]}
              value={otp} onChangeText={t => setOtp(t.replace(/[^0-9]/g,''))}
              placeholder="000000" placeholderTextColor={C.sub} keyboardType="number-pad" maxLength={6}
            />
            <TouchableOpacity style={[s.btn, loading && { opacity:0.6 }]} onPress={doVerify} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Verify & Enter </Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems:'center', marginTop:16 }} onPress={async () => { setOtp(''); await sendOtp(lemail.trim() || semail.trim()); }}>
              <Text style={{ color:C.accent }}>Resend code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems:'center', marginTop:12 }} onPress={() => { clear(); setStep('login'); }}>
              <Text style={{ color:C.sub, fontSize:12 }}> Back to login</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={{ color:C.sub, fontSize:11, textAlign:'center', marginTop:20 }}> 256-bit encrypted  Never shared</Text>
        <View style={{ height:50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow:1, padding:24, justifyContent:'center', backgroundColor:'#0a0a0f' },
  logoWrap: { alignItems:'center', marginBottom:32 },
  logoIcon: { fontSize:52, color:'#a855f7' },
  logoTitle: { color:'#fff', fontSize:26, fontWeight:'800', marginTop:8 },
  logoSub: { color:'#888', fontSize:13, marginTop:4 },
  card: { backgroundColor:'#13131f', borderRadius:20, padding:24 },
  tabRow: { flexDirection:'row', backgroundColor:'#0a0a0f', borderRadius:12, padding:4, marginBottom:20, gap:4 },
  tab: { flex:1, paddingVertical:10, borderRadius:10, alignItems:'center' },
  tabActive: { backgroundColor:'#a855f7' },
  tabTxt: { color:'#888', fontWeight:'700', fontSize:14 },
  lbl: { color:'#888', fontSize:12, fontWeight:'600', marginBottom:6, marginTop:10 },
  inp: { backgroundColor:'#0d0d1a', borderRadius:12, padding:14, color:'#fff', fontSize:15, marginBottom:2 },
  pwRow: { flexDirection:'row', gap:8, alignItems:'center', marginBottom:2 },
  eyeBtn: { backgroundColor:'#0d0d1a', borderRadius:12, padding:14 },
  btn: { backgroundColor:'#a855f7', borderRadius:14, padding:16, alignItems:'center', marginTop:8 },
  btnTxt: { color:'#fff', fontWeight:'800', fontSize:16 },
  errBox: { backgroundColor:'#ef444422', borderRadius:10, padding:12, marginBottom:12, borderWidth:1, borderColor:'#ef4444' },
  errTxt: { color:'#ef4444', fontSize:13 },
});
