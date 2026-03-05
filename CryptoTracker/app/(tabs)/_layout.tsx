import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor:'#0d0d1a', borderTopColor:'#1a1a2e', height:60 },
      tabBarActiveTintColor: '#a855f7',
      tabBarInactiveTintColor: '#555',
      tabBarLabelStyle: { fontSize:11, marginBottom:4 },
    }}>
      <Tabs.Screen name="index" options={{ title:'Dashboard', tabBarIcon:({color,size}) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="holdings" options={{ title:'Holdings', tabBarIcon:({color,size}) => <Ionicons name="wallet" size={size} color={color} /> }} />
      <Tabs.Screen name="market" options={{ title:'Market', tabBarIcon:({color,size}) => <Ionicons name="trending-up" size={size} color={color} /> }} />
      <Tabs.Screen name="transactions" options={{ title:'Trade', tabBarIcon:({color,size}) => <Ionicons name="swap-horizontal" size={size} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title:'Analytics', tabBarIcon:({color,size}) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
      <Tabs.Screen name="news" options={{ title:'News', tabBarIcon:({color,size}) => <Ionicons name="newspaper" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title:'Settings', tabBarIcon:({color,size}) => <Ionicons name="settings" size={size} color={color} /> }} />
    </Tabs>
  );
}
