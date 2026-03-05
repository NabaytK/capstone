import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  coinId: string;
  color?: string;
}

export default function PriceChart({ coinId, color = '#00d4ff' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color }]}>📈 Chart: {coinId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 80, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 8, marginVertical: 8 },
  text: { fontSize: 12 },
});
