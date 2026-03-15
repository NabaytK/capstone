import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadPortfolio } from '../../services/storage';
import { getMultiplePrices, getBitcoinData, getTopMarketCoins } from '../../services/api';
import { calculateHoldings, getPortfolioTotals, EnrichedHolding } from '../../services/portfolio';
import { calculatePortfolioRisk, calculateVaR, calculateDiversification, getRecommendations } from '../../services/risk';

const C = { bg:'#0a0a0f', card:'#13131f', accent:'#a855f7', green:'#22c55e', red:'#ef4444', text:'#fff', sub:'#888', border:'#1a1a2e' };
const fmt = (n: number) => '$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const W = Dimensions.get('window').width - 64;
const PIE_COLORS = ['#a855f7','#7c3aed','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#8b5cf6'];
const PERIODS = ['24H','7D','30D','All'];

function PieChart({ holdings, totalValue }: { holdings: EnrichedHolding[], totalValue: number }) {
  if (!holdings.length || !totalValue) return (
    <View style={{ alignItems:'center', padding:32 }}>
      <Ionicons name="pie-chart-outline" size={48} color="#333" />
      <Text style={{ color:'#555', marginTop:12 }}>Add transactions to see allocation</Text>
    </View>
  );
  const size = 180; const cx = size/2; const cy = size/2; const r = 70; const inner = 42;
  let angle = -Math.PI / 2;
  const slices = holdings.slice(0,8).map((h, i) => {
    const pct = (h.currentValue || 0) / totalValue;
    const a1 = angle; const a2 = angle + pct * 2 * Math.PI; angle = a2;
    const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2); const y2 = cy + r * Math.sin(a2);
    const xi1 = cx + inner * Math.cos(a1); const yi1 = cy + inner * Math.sin(a1);
    const xi2 = cx + inner * Math.cos(a2); const yi2 = cy + inner * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    return { path:`M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`, color:PIE_COLORS[i%PIE_COLORS.length], symbol:h.coinSymbol, pct:(pct*100).toFixed(1), value:h.currentValue||0 };
  });
  return (
    <View style={{ alignItems:'center', marginVertical:8 }}>
      <View style={{ width:size, height:size, position:'relative' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((sl,i) => <path key={i} d={sl.path} fill={sl.color} />)}
          <circle cx={cx} cy={cy} r={inner-2} fill="#13131f" />
        </svg>
        <View style={{ position:'absolute', top:0, left:0, width:size, height:size, alignItems:'center', justifyContent:'center' }}>
          <Text style={{ color:'#fff', fontSize:13, fontWeight:'800' }}>{fmt(totalValue)}</Text>
          <Text style={{ color:'#888', fontSize:10 }}>Total</Text>
        </View>
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'center', gap:10, marginTop:16 }}>
        {slices.map((sl,i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:6, minWidth:80 }}>
            <View style={{ width:10, height:10, borderRadius:5, backgroundColor:sl.color }} />
            <Text style={{ color:'#aaa', fontSize:12 }}>{sl.symbol?.toUpperCase()} {sl.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BarChart({ holdings }: { holdings: EnrichedHolding[] }) {
  if (!holdings.length) return (
    <View style={{ alignItems:'center', padding:32 }}>
      <Ionicons name="bar-chart-outline" size={48} color="#333" />
      <Text style={{ color:'#555', marginTop:12 }}>Add transactions to see performance</Text>
    </View>
  );
  const maxAbs = Math.max(...holdings.map(h => Math.abs(h.change24h || 0)), 1);
  return (
    <View style={{ gap:10 }}>
      {holdings.slice(0,6).map((h, i) => {
        const pct = h.change24h || 0;
        const barW = Math.abs(pct) / maxAbs * 100;
        const color = pct >= 0 ? C.green : C.red;
        return (
          <View key={i}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
              <Text style={{ color:'#fff', fontSize:13, fontWeight:'700' }}>{h.coinSymbol?.toUpperCase()}</Text>
              <Text style={{ color, fontSize:13, fontWeight:'700' }}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</Text>
            </View>
            <View style={{ height:8, backgroundColor:'#1a1a2e', borderRadius:4, overflow:'hidden' }}>
              <View style={{ width:barW+'%', height:'100%', backgroundColor:color, borderRadius:4 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RiskMeter({ score }: { score: number }) {
  const color = score > 70 ? C.red : score > 40 ? '#f59e0b' : C.green;
  const label = score > 70 ? 'High Risk' : score > 40 ? 'Medium Risk' : 'Low Risk';
  return (
    <View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
        <Text style={{ color:'#888', fontSize:13 }}>Risk Level</Text>
        <Text style={{ color, fontSize:13, fontWeight:'800' }}>{label}</Text>
      </View>
      <View style={{ height:10, backgroundColor:'#1a1a2e', borderRadius:5, overflow:'hidden' }}>
        <View style={{ width:score+'%', height:'100%', backgroundColor:color, borderRadius:5 }} />
      </View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:4 }}>
        <Text style={{ color:'#555', fontSize:10 }}>Low</Text>
        <Text style={{ color:'#555', fontSize:10 }}>{score}/100</Text>
        <Text style={{ color:'#555', fontSize:10 }}>High</Text>
      </View>
    </View>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [totals, setTotals] = useState({ totalValue:0, totalCost:0, totalPL:0, totalPLPct:0 });
  const [btc, setBtc] = useState<any>(null);
  const [period, setPeriod] = useState('24H');

  const load = async () => {
    try {
      const [portfolio, btcData] = await Promise.all([loadPortfolio(), getBitcoinData().catch(()=>null)]);
      setBtc(btcData);
      if (portfolio.length) {
        const prices = await getMultiplePrices(portfolio.map((h:any) => h.coinId)).catch(()=>({}));
        const enriched = calculateHoldings(portfolio, prices);
        setHoldings(enriched);
        setTotals(getPortfolioTotals(enriched));
      }
    } catch(e){ console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return (
    <View style={{ flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color:C.sub }}>Loading analytics...</Text>
    </View>
  );

  const riskScore = calculatePortfolioRisk(holdings);
  const varVal = calculateVaR(holdings, totals.totalValue);
  const divScore = calculateDiversification(holdings, totals.totalValue);
  const recs = getRecommendations(holdings, riskScore, divScore);
  const riskColor = riskScore > 70 ? C.red : riskScore > 40 ? '#f59e0b' : C.green;
  const portReturn = totals.totalCost > 0 ? ((totals.totalValue - totals.totalCost)/totals.totalCost)*100 : 0;
  const btcReturn = btc?.usd_24h_change || 0;

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} tintColor={C.accent} />} showsVerticalScrollIndicator={false}>
      <View style={{ padding:20, paddingTop:60 }}>
        <Text style={{ color:'#fff', fontSize:28, fontWeight:'800' }}>Analytics</Text>
        <Text style={{ color:'#888', fontSize:14, marginTop:4 }}>Portfolio insights & risk analysis</Text>
      </View>

      {/* Key Stats */}
      <View style={{ flexDirection:'row', gap:10, marginHorizontal:16, marginBottom:12 }}>
        <View style={[s.statCard, { flex:1, borderColor: riskColor+'44' }]}>
          <Text style={s.statLbl}>Risk Score</Text>
          <Text style={[s.statVal, { color:riskColor }]}>{riskScore}</Text>
          <Text style={s.statSub}>/100</Text>
        </View>
        <View style={[s.statCard, { flex:1, borderColor:'#a855f744' }]}>
          <Text style={s.statLbl}>Diversification</Text>
          <Text style={[s.statVal, { color:C.accent }]}>{divScore}</Text>
          <Text style={s.statSub}>/100</Text>
        </View>
      </View>
      <View style={{ flexDirection:'row', gap:10, marginHorizontal:16, marginBottom:16 }}>
        <View style={[s.statCard, { flex:1, borderColor:'#ef444444' }]}>
          <Text style={s.statLbl}>Value at Risk</Text>
          <Text style={[s.statVal, { color:C.red, fontSize:18 }]}>{fmt(varVal)}</Text>
          <Text style={s.statSub}>95% confidence</Text>
        </View>
        <View style={[s.statCard, { flex:1, borderColor: portReturn>=0 ? '#22c55e44' : '#ef444444' }]}>
          <Text style={s.statLbl}>Total Return</Text>
          <Text style={[s.statVal, { color: portReturn>=0 ? C.green : C.red, fontSize:18 }]}>{portReturn>=0?'+':''}{portReturn.toFixed(2)}%</Text>
          <Text style={s.statSub}>vs cost basis</Text>
        </View>
      </View>

      {/* Risk Meter */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Risk Analysis</Text>
        <RiskMeter score={riskScore} />
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:16 }}>
          <View style={{ alignItems:'center' }}>
            <Text style={{ color:'#888', fontSize:11 }}>VALUE AT RISK</Text>
            <Text style={{ color:C.red, fontSize:15, fontWeight:'800', marginTop:4 }}>{fmt(varVal)}</Text>
          </View>
          <View style={{ alignItems:'center' }}>
            <Text style={{ color:'#888', fontSize:11 }}>DIVERSIFICATION</Text>
            <Text style={{ color:C.accent, fontSize:15, fontWeight:'800', marginTop:4 }}>{divScore}/100</Text>
          </View>
          <View style={{ alignItems:'center' }}>
            <Text style={{ color:'#888', fontSize:11 }}>HOLDINGS</Text>
            <Text style={{ color:'#fff', fontSize:15, fontWeight:'800', marginTop:4 }}>{holdings.length}</Text>
          </View>
        </View>
      </View>

      {/* Portfolio Allocation Pie */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Portfolio Allocation</Text>
        <PieChart holdings={holdings} totalValue={totals.totalValue} />
      </View>

      {/* 24H Performance Bar Chart */}
      <View style={s.card}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <Text style={s.cardTitle}>24H Performance</Text>
          <Ionicons name="bar-chart-outline" size={18} color={C.accent} />
        </View>
        <BarChart holdings={holdings} />
      </View>

      {/* BTC Benchmark */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Benchmark Comparison</Text>
        <View style={{ flexDirection:'row', gap:12, marginBottom:16 }}>
          <View style={[s.benchCard, { flex:1 }]}>
            <Text style={{ color:'#888', fontSize:11, marginBottom:4 }}>YOUR PORTFOLIO</Text>
            <Text style={{ color: portReturn>=0 ? C.green : C.red, fontSize:22, fontWeight:'900' }}>
              {portReturn>=0?'+':''}{portReturn.toFixed(2)}%
            </Text>
            <Text style={{ color:'#555', fontSize:11, marginTop:2 }}>All time return</Text>
          </View>
          <View style={[s.benchCard, { flex:1 }]}>
            <Text style={{ color:'#888', fontSize:11, marginBottom:4 }}>BITCOIN 24H</Text>
            <Text style={{ color: btcReturn>=0 ? C.green : C.red, fontSize:22, fontWeight:'900' }}>
              {btcReturn>=0?'+':''}{btcReturn.toFixed(2)}%
            </Text>
            <Text style={{ color:'#555', fontSize:11, marginTop:2 }}>Market benchmark</Text>
          </View>
        </View>
        <View style={{ backgroundColor:'#0a0a0f', borderRadius:10, padding:12 }}>
          <Text style={{ color:'#888', fontSize:12 }}>
            {portReturn > btcReturn
              ? 'Your portfolio is outperforming Bitcoin'
              : portReturn < btcReturn
              ? 'Your portfolio is underperforming Bitcoin'
              : 'Your portfolio matches Bitcoin performance'}
          </Text>
        </View>
      </View>

      {/* Holdings Breakdown */}
      {holdings.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Holdings Breakdown</Text>
          {holdings.map((h, i) => (
            <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, borderTopWidth:i>0?1:0, borderTopColor:'#1a1a2e' }}>
              <View style={{ width:40, height:40, borderRadius:20, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center' }}>
                <Text style={{ color:C.accent, fontSize:11, fontWeight:'800' }}>{h.coinSymbol?.toUpperCase().slice(0,3)}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:'#fff', fontWeight:'700' }}>{h.coinName}</Text>
                <Text style={{ color:'#888', fontSize:12 }}>{h.totalAmount?.toFixed(4)} units</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={{ color:'#fff', fontWeight:'700' }}>{fmt(h.currentValue||0)}</Text>
                <Text style={{ color: (totals.totalValue > 0 ? (h.currentValue||0)/totals.totalValue*100 : 0) > 0 ? C.accent : '#888', fontSize:12 }}>
                  {totals.totalValue > 0 ? ((h.currentValue||0)/totals.totalValue*100).toFixed(1) : '0'}% of portfolio
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI Recommendations */}
      <View style={s.card}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 }}>
          <View style={{ width:28, height:28, borderRadius:8, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="sparkles" size={14} color={C.accent} />
          </View>
          <Text style={s.cardTitle}>AI Recommendations</Text>
        </View>
        {recs.length === 0 ? (
          <Text style={{ color:'#888', textAlign:'center', padding:16 }}>Add holdings to get personalized recommendations</Text>
        ) : recs.map((r, i) => (
          <View key={i} style={{ flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:12, paddingBottom:12, borderBottomWidth: i<recs.length-1?1:0, borderBottomColor:'#1a1a2e' }}>
            <View style={{ width:24, height:24, borderRadius:12, backgroundColor:'#a855f722', alignItems:'center', justifyContent:'center', marginTop:1 }}>
              <Text style={{ color:C.accent, fontSize:12, fontWeight:'800' }}>{i+1}</Text>
            </View>
            <Text style={{ color:'#ddd', flex:1, fontSize:14, lineHeight:21 }}>{r}</Text>
          </View>
        ))}
      </View>

      <View style={{ height:100 }} />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  statCard: { backgroundColor:'#13131f', borderRadius:14, padding:16, borderWidth:1, borderColor:'#1a1a2e' },
  statLbl: { color:'#888', fontSize:12, marginBottom:4 },
  statVal: { fontSize:28, fontWeight:'900', color:'#fff' },
  statSub: { color:'#888', fontSize:11, marginTop:2 },
  card: { backgroundColor:'#13131f', marginHorizontal:16, marginBottom:12, borderRadius:16, padding:16 },
  cardTitle: { color:'#fff', fontSize:16, fontWeight:'800', marginBottom:0 },
  benchCard: { backgroundColor:'#0a0a0f', borderRadius:12, padding:14 },
});
