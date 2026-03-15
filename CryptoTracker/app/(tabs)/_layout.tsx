import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {

  return (

    <Tabs
      screenOptions={{
        headerShown:false,
        tabBarStyle:{
          backgroundColor:"#0a0a0f",
          borderTopColor:"#1a1a2e"
        },
        tabBarActiveTintColor:"#a855f7",
        tabBarInactiveTintColor:"#666"
      }}
    >

      <Tabs.Screen
        name="market"
        options={{
          title:"Market",
          tabBarIcon:({color,size}) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title:"Transactions",
          tabBarIcon:({color,size}) => (
            <Ionicons name="swap-horizontal-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="news"
        options={{
          title:"News",
          tabBarIcon:({color,size}) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title:"Settings",
          tabBarIcon:({color,size}) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )
        }}
      />

    </Tabs>

  );

}
