import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    ...Ionicons.font
  });

  useEffect(() => {

    let done = false;

    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      router.replace('/(auth)/login');
    }, 3000);

    const unsub = onAuthStateChanged(auth, async (user) => {

      if (done) return;

      done = true;

      clearTimeout(timeout);

      if (user) {

        const passed = await AsyncStorage.getItem('2fa_passed');

        router.replace(passed === 'true' ? '/(tabs)' : '/(auth)/login');

      } else {

        router.replace('/(auth)/login');

      }

    });

    return () => {

      unsub();

      clearTimeout(timeout);

    };

  }, []);

  if (!fontsLoaded) {

    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator />
      </View>
    );

  }

  return (
    <Stack screenOptions={{ headerShown:false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );

}
