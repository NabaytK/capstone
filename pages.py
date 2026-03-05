# pages.py
# All page/tab content matching the Figma design
# Each function renders one section of the app

import streamlit as st
import pandas as pd
from datetime import datetime

from api_handler import get_crypto_price, get_historical_prices, get_market_data
from risk_analysis import calculate_risk_level, calculate_risk_score
from analytics import (
    create_allocation_pie_chart, create_performance_bar_chart,
    create_price_history_chart, create_risk_gauge,
    create_comparison_chart, create_holdings_value_chart,
    create_volatility_chart, create_portfolio_vs_btc_line, COLORS
)
from export_handler import export_portfolio_csv, export_transactions_csv, generate_report_text
from portfolio import delete_transaction
from ui_theme import PLOTLY_DARK


# ============================================
# EMPTY STATE (no portfolio yet)
# ============================================
def render_empty_state():
    """Market overview when user has no holdings"""
    st.markdown("""
    <div class="hero-card">
        <div class="label">Welcome to Crypto Coin</div>
        <div class="big-value" style="font-size:1.8rem;">Track your crypto.<br>Understand your risk.</div>
        <div style="color:#a3a3a3; font-size:0.85rem; margin-top:8px;">
            Add your first transaction using the sidebar to get started
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    market_data = get_market_data()
    if not market_data:
        st.warning("Could not load market data.")
        return
    
    # Top 3 as stat boxes
    cols = st.columns(3)
    for i, coin in enumerate(market_data[:3]):
        ch = coin.get('price_change_percentage_24h', 0)
        delta = "stat-sub-green" if ch >= 0 else "stat-sub-red"
        arrow = "↑" if ch >= 0 else "↓"
        with cols[i]:
            st.markdown(f"""
            <div class="stat-box">
                <div class="stat-label">{coin['name']}</div>
                <div class="stat-value" style="font-size:1.3rem;">${coin['current_price']:,.2f}</div>
                <div class="{delta}">{arrow} {abs(ch):.2f}%</div>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Market table
    st.markdown('<div class="card-title">📊 Live Market</div>', unsafe_allow_html=True)
    rows = ""
    for i, coin in enumerate(market_data[:10]):
        ch = coin.get('price_change_percentage_24h', 0)
        cc = "market-change-up" if ch >= 0 else "market-change-down"
        arrow = "↑" if ch >= 0 else "↓"
        mcap = coin.get('market_cap', 0)
        ms = f"${mcap/1e12:.2f}T" if mcap >= 1e12 else (f"${mcap/1e9:.2f}B" if mcap >= 1e9 else f"${mcap/1e6:.0f}M")
        rows += f"""<div class="market-row">
            <div class="market-rank">{i+1}</div>
            <div class="market-info"><div class="market-name">{coin['name']}</div><div class="market-sym">{coin.get('symbol','').upper()}</div></div>
            <div class="market-price">${coin['current_price']:,.2f}</div>
            <div class="{cc}">{arrow} {abs(ch):.2f}%</div>
            <div class="market-mcap">{ms}</div>
        </div>"""
    st.markdown(f'<div class="dark-card">{rows}</div>', unsafe_allow_html=True)
    
    # Bitcoin chart
    st.markdown('<div class="card-title">📈 Bitcoin — 30 Day</div>', unsafe_allow_html=True)
    btc_hist = get_historical_prices('bitcoin', 30)
    if btc_hist:
        fig = create_price_history_chart(btc_hist, "Bitcoin")
        fig.update_layout(**PLOTLY_DARK)
        st.plotly_chart(fig, use_container_width=True)


# ============================================
# HERO + METRICS
# ============================================
def render_hero(total_value, total_pl, total_pl_pct):
    """Portfolio value hero card (Figma gradient card)"""
    delta_class = "delta-up" if total_pl >= 0 else "delta-down"
    arrow = "↑" if total_pl >= 0 else "↓"
    sign = "+" if total_pl >= 0 else ""
    st.markdown(f"""
    <div class="hero-card">
        <div class="label">Total Portfolio Value</div>
        <div class="big-value">${total_value:,.2f}</div>
        <div class="{delta_class}">
            {arrow} {sign}{total_pl_pct:.2f}% ({sign}${abs(total_pl):,.2f})
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_risk_card(risk_score, risk_label):
    """Risk score card (colored by level like Figma)"""
    # Determine card style
    clean_label = risk_label.replace('🟢 ', '').replace('🟡 ', '').replace('🔴 ', '')
    if risk_score < 30:
        card_class, val_class = "risk-card-low", "risk-value-low"
        desc = "Well diversified portfolio with lower volatility."
    elif risk_score < 60:
        card_class, val_class = "risk-card-med", "risk-value-med"
        desc = "A balanced approach to crypto investing."
    else:
        card_class, val_class = "risk-card-high", "risk-value-high"
        desc = "Consider diversifying across more assets."
    
    st.markdown(f"""
    <div class="{card_class}">
        <div class="risk-label">Risk Score</div>
        <div class="{val_class}">{clean_label} — {risk_score}/100</div>
        <div class="risk-desc">{desc}</div>
    </div>
    """, unsafe_allow_html=True)


def render_quick_stats(holdings_data, total_value, var_amount):
    """Quick stat boxes (Figma: Total Assets, Best Performer, VaR)"""
    # Find best performer
    best = max(holdings_data, key=lambda h: h.get('profit_loss_pct', 0))
    best_pct = best.get('profit_loss_pct', 0)
    
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(f"""<div class="stat-box">
            <div class="stat-label">Total Assets</div>
            <div class="stat-value">{len(holdings_data)}</div>
        </div>""", unsafe_allow_html=True)
    with c2:
        st.markdown(f"""<div class="stat-box">
            <div class="stat-label">Best Performer</div>
            <div class="stat-value" style="font-size:1.2rem;">{best['name']}</div>
            <div class="stat-sub-green">{best_pct:+.2f}%</div>
        </div>""", unsafe_allow_html=True)
    with c3:
        st.markdown(f"""<div class="stat-box">
            <div class="stat-label">Value at Risk (95%)</div>
            <div class="stat-value" style="font-size:1.2rem; color:#f87171;">${var_amount:,.2f}</div>
            <div style="color:#a3a3a3; font-size:0.75rem;">Max daily loss</div>
        </div>""", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)


# ============================================
# TAB 1: DASHBOARD
# ============================================
def render_dashboard(holdings_data, recommendations):
    """Dashboard: allocation pie, P/L chart, Bitcoin comparison"""
    col1, col2 = st.columns(2)
    with col1:
        fig = create_allocation_pie_chart(holdings_data)
        if fig:
            fig.update_layout(**PLOTLY_DARK)
            st.plotly_chart(fig, use_container_width=True)
    with col2:
        fig2 = create_performance_bar_chart(holdings_data)
        if fig2:
            fig2.update_layout(**PLOTLY_DARK)
            st.plotly_chart(fig2, use_container_width=True)
    
    # Portfolio vs Bitcoin line chart (Figma style)
    btc_price, btc_change = get_crypto_price('bitcoin')
    if btc_price and btc_change is not None:
        avg_change = sum(h.get('change_24h', 0) for h in holdings_data) / max(len(holdings_data), 1)
        fig3 = create_portfolio_vs_btc_line(avg_change, btc_change)
        fig3.update_layout(**PLOTLY_DARK)
        st.plotly_chart(fig3, use_container_width=True)
        
        # Performance note (Figma style)
        if avg_change >= btc_change:
            st.markdown("""<div class="dark-card-compact" style="display:flex;align-items:center;gap:8px;">
                <div style="width:12px;height:12px;border-radius:50%;background:#06b6d4;"></div>
                <span style="color:#a3a3a3;font-size:0.85rem;">Your performance is tracking well</span>
            </div>""", unsafe_allow_html=True)
        else:
            st.markdown("""<div class="dark-card-compact" style="display:flex;align-items:center;gap:8px;">
                <div style="width:12px;height:12px;border-radius:50%;background:#f59e0b;"></div>
                <span style="color:#a3a3a3;font-size:0.85rem;">Bitcoin is outperforming your portfolio</span>
            </div>""", unsafe_allow_html=True)
    
    # Recommendations
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="card-title">💡 Recommendations</div>', unsafe_allow_html=True)
    for rec in recommendations:
        st.markdown(f"""<div class="insight-row"><span class="insight-label">{rec}</span></div>""", unsafe_allow_html=True)


# ============================================
# TAB 2: PORTFOLIO (Holdings)
# ============================================
def render_holdings(holdings_data):
    """Portfolio page: pie chart + asset cards (Figma style)"""
    # Pie chart
    fig = create_allocation_pie_chart(holdings_data)
    if fig:
        fig.update_layout(**PLOTLY_DARK)
        st.plotly_chart(fig, use_container_width=True)
    
    # Asset list (Figma design)
    st.markdown('<div class="card-title">Your Assets</div>', unsafe_allow_html=True)
    
    for i, h in enumerate(holdings_data):
        color = COLORS[i % len(COLORS)]
        ch = h.get('change_24h', 0)
        ch_class = "asset-change-up" if ch >= 0 else "asset-change-down"
        arrow = "↑" if ch >= 0 else "↓"
        pl = h.get('profit_loss', 0)
        pl_pct = h.get('profit_loss_pct', 0)
        pl_class = "asset-change-up" if pl >= 0 else "asset-change-down"
        pl_sign = "+" if pl >= 0 else ""
        
        st.markdown(f"""
        <div class="asset-row">
            <div class="top">
                <div class="left">
                    <div class="asset-icon" style="background:{color}20; color:{color};">{h['name'][:2]}</div>
                    <div>
                        <div class="asset-name">{h['name']}</div>
                        <div class="asset-symbol">{h.get('id', '').upper()}</div>
                    </div>
                </div>
                <div>
                    <div class="asset-value">${h['current_value']:,.2f}</div>
                    <div class="{ch_class}">{arrow} {abs(ch):.2f}%</div>
                </div>
            </div>
            <div class="bottom">
                <span>Qty: {h['amount']:.4f}</span>
                <span>Avg: ${h.get('avg_cost', 0):,.2f}</span>
                <span style="color:{'#4ade80' if pl >= 0 else '#f87171'};">{pl_sign}${pl:,.2f} ({pl_pct:+.1f}%)</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    fig2 = create_holdings_value_chart(holdings_data)
    if fig2:
        fig2.update_layout(**PLOTLY_DARK)
        st.plotly_chart(fig2, use_container_width=True)


# ============================================
# TAB 3: PERFORMANCE
# ============================================
def render_performance(holdings_data):
    """Performance page: price history + performance cards"""
    coin_names = [h['name'] for h in holdings_data]
    selected = st.selectbox("Select coin for price history", coin_names)
    selected_id = next((h['id'] for h in holdings_data if h['name'] == selected), None)
    
    if selected_id:
        days = st.selectbox("Time period", [7, 14, 30, 90], index=2)
        history = get_historical_prices(selected_id, days)
        if history:
            fig = create_price_history_chart(history, selected)
            fig.update_layout(**PLOTLY_DARK)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning("Could not load price history. Try again in a minute.")
    
    # Performance summary cards
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="card-title">Performance Summary</div>', unsafe_allow_html=True)
    perf_cols = st.columns(min(len(holdings_data), 4))
    for i, h in enumerate(holdings_data):
        with perf_cols[i % len(perf_cols)]:
            pc = "#4ade80" if h.get('profit_loss', 0) >= 0 else "#f87171"
            st.markdown(f"""<div class="stat-box" style="margin-bottom:12px;">
                <div class="stat-label">{h['name']}</div>
                <div style="color:{pc};font-size:1.3rem;font-weight:600;">{h.get('profit_loss_pct', 0):+.2f}%</div>
                <div style="color:{pc};font-size:0.85rem;">${h.get('profit_loss', 0):,.2f}</div>
            </div>""", unsafe_allow_html=True)


# ============================================
# TAB 4: TRANSACTIONS
# ============================================
def render_transactions(transactions, username):
    """Transaction history with styled rows"""
    if not transactions:
        st.info("No transactions yet. Add your first using the sidebar!")
        return
    
    for txn in reversed(transactions):
        tc = "txn-buy" if txn['type'] == 'buy' else "txn-sell"
        icon = "🟢" if txn['type'] == 'buy' else "🔴"
        st.markdown(f"""
        <div class="txn-row">
            <div>
                <span class="{tc}">{icon} {txn['type'].upper()}</span>
                <span style="color:#fff;font-weight:500;margin-left:12px;">{txn['coin_name']}</span>
            </div>
            <div style="color:#a3a3a3;font-size:0.9rem;">{txn['amount']:.4f} @ ${txn['price_per_coin']:,.2f}</div>
            <div style="text-align:right;">
                <div style="color:#fff;font-weight:500;">${txn['total_cost']:,.2f}</div>
                <div style="color:#525252;font-size:0.75rem;">{txn['date']}</div>
            </div>
        </div>""", unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    del_id = st.number_input("Delete transaction by ID", min_value=1, step=1)
    if st.button("Delete Transaction"):
        delete_transaction(username, int(del_id))
        st.rerun()


# ============================================
# TAB 5: ANALYTICS (Figma style)
# ============================================
def render_analytics(holdings_data, risk_score, risk_label, var_amount, div_score, div_recommendation, recommendations, total_value):
    """Analytics page matching Figma: risk overview, how it's calculated, volatility, performance, insights"""
    
    # Risk Score Overview (Figma gradient card)
    clean_label = risk_label.replace('🟢 ', '').replace('🟡 ', '').replace('🔴 ', '')
    risk_color = "#4ade80" if risk_score < 30 else ("#facc15" if risk_score < 60 else "#f87171")
    
    st.markdown(f"""
    <div class="hero-card">
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
            <div style="font-size:2.5rem;">🛡️</div>
            <div>
                <div class="label">Current Risk Score</div>
                <div style="color:{risk_color}; font-size:2rem; font-weight:600;">{clean_label}</div>
            </div>
        </div>
        <div style="border-top:1px solid rgba(6,182,212,0.2); padding-top:12px; margin-top:8px;">
            <div style="display:flex; align-items:flex-start; gap:8px;">
                <span style="color:#22d3ee;">⚠️</span>
                <span style="color:#d4d4d4; font-size:0.85rem;">
                    Risk is calculated based on weighted volatility of your assets and portfolio diversity.
                </span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # How Risk is Calculated (Figma numbered steps)
    st.markdown(f"""
    <div class="dark-card">
        <div class="card-title"><span class="icon">📊</span> How Risk is Calculated</div>
        <div class="step-item">
            <div class="step-num">1</div>
            <div><div class="step-title">Asset Volatility</div>
            <div class="step-desc">Each crypto has a historical volatility score based on price fluctuations.</div></div>
        </div>
        <div class="step-item">
            <div class="step-num">2</div>
            <div><div class="step-title">Portfolio Weighting</div>
            <div class="step-desc">Volatility is weighted by how much each asset makes up your portfolio.</div></div>
        </div>
        <div class="step-item">
            <div class="step-num">3</div>
            <div><div class="step-title">Diversification Factor</div>
            <div class="step-desc">More diverse portfolios generally have lower overall risk scores.</div></div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Volatility by Asset bar chart
    vol_chart = create_volatility_chart(holdings_data)
    if vol_chart:
        vol_chart.update_layout(**PLOTLY_DARK)
        st.plotly_chart(vol_chart, use_container_width=True)
    st.markdown('<div style="color:#a3a3a3;font-size:0.8rem;margin-top:-10px;margin-bottom:20px;">Lower volatility = more stable. Higher volatility = more price swings.</div>', unsafe_allow_html=True)
    
    # Performance breakdown bar chart
    perf_chart = create_performance_bar_chart(holdings_data)
    if perf_chart:
        perf_chart.update_layout(**PLOTLY_DARK, title="Performance Breakdown")
        st.plotly_chart(perf_chart, use_container_width=True)
    
    # Risk gauge
    col1, col2 = st.columns(2)
    with col1:
        gauge = create_risk_gauge(risk_score)
        gauge.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font_color='#a3a3a3')
        st.plotly_chart(gauge, use_container_width=True)
    with col2:
        st.markdown(f"""
        <div class="dark-card">
            <div class="card-title">Risk Metrics</div>
            <div style="margin-bottom:14px;"><div class="stat-label">Portfolio Risk</div>
            <div style="color:#fff;font-size:1.2rem;font-weight:600;">{risk_score}/100</div></div>
            <div style="margin-bottom:14px;"><div class="stat-label">Value at Risk (95%)</div>
            <div style="color:#f87171;font-size:1.2rem;font-weight:600;">${var_amount:,.2f}</div>
            <div style="color:#525252;font-size:0.75rem;">5% chance of losing this in one day</div></div>
            <div><div class="stat-label">Diversification</div>
            <div style="color:#fff;font-size:1.2rem;font-weight:600;">{div_score}/100</div>
            <div style="color:#a3a3a3;font-size:0.75rem;">{div_recommendation}</div></div>
        </div>""", unsafe_allow_html=True)
    
    # Portfolio Insights (Figma style)
    st.markdown(f"""
    <div class="dark-card">
        <div class="card-title"><span class="icon">📊</span> Portfolio Insights</div>
    """, unsafe_allow_html=True)
    
    # Most/Least volatile
    if holdings_data:
        most_vol = max(holdings_data, key=lambda h: abs(h.get('change_24h', 0)))
        least_vol = min(holdings_data, key=lambda h: abs(h.get('change_24h', 0)))
        largest = max(holdings_data, key=lambda h: h['current_value'])
        largest_pct = (largest['current_value'] / total_value * 100) if total_value > 0 else 0
        
        st.markdown(f"""
        <div class="insight-row">
            <span class="insight-label">Most Volatile Asset</span>
            <span class="insight-value insight-red">{most_vol['name']} ({abs(most_vol.get('change_24h', 0)):.1f}%)</span>
        </div>
        <div class="insight-row">
            <span class="insight-label">Least Volatile Asset</span>
            <span class="insight-value insight-green">{least_vol['name']} ({abs(least_vol.get('change_24h', 0)):.1f}%)</span>
        </div>
        <div class="insight-row">
            <span class="insight-label">Portfolio Diversity</span>
            <span class="insight-value insight-cyan">{len(holdings_data)} Assets</span>
        </div>
        <div class="insight-row">
            <span class="insight-label">Largest Holding</span>
            <span class="insight-value">{largest['name']} ({largest_pct:.0f}%)</span>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Per-asset risk table
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="card-title">Individual Asset Risk</div>', unsafe_allow_html=True)
    risk_table = []
    for h in holdings_data:
        score = calculate_risk_score(h.get('change_24h', 0))
        level, _ = calculate_risk_level(h.get('change_24h', 0))
        weight = (h['current_value'] / total_value * 100) if total_value > 0 else 0
        risk_table.append({'Coin': h['name'], 'Weight': f"{weight:.1f}%", 'Volatility': f"{abs(h.get('change_24h', 0)):.2f}%", 'Risk': f"{score}/100", 'Level': level})
    st.dataframe(pd.DataFrame(risk_table), use_container_width=True)


# ============================================
# TAB 6: EXPORT
# ============================================
def render_export(holdings_data, transactions, risk_score, risk_label, var_amount, div_score):
    """Export page with download buttons"""
    col1, col2 = st.columns(2)
    with col1:
        st.markdown('<div class="dark-card"><div class="card-title">📊 Portfolio CSV</div><div style="color:#a3a3a3;font-size:0.85rem;">Holdings with P/L data</div></div>', unsafe_allow_html=True)
        st.download_button("Download Portfolio CSV", export_portfolio_csv(holdings_data), f"portfolio_{datetime.now().strftime('%Y%m%d')}.csv", "text/csv", use_container_width=True)
    with col2:
        st.markdown('<div class="dark-card"><div class="card-title">📝 Transactions CSV</div><div style="color:#a3a3a3;font-size:0.85rem;">Full transaction history</div></div>', unsafe_allow_html=True)
        if transactions:
            st.download_button("Download Transactions CSV", export_transactions_csv(transactions), f"transactions_{datetime.now().strftime('%Y%m%d')}.csv", "text/csv", use_container_width=True)
        else:
            st.info("No transactions to export")
    
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="dark-card"><div class="card-title">📋 Full Report</div><div style="color:#a3a3a3;font-size:0.85rem;">Text summary of portfolio analysis</div></div>', unsafe_allow_html=True)
    report = generate_report_text(holdings_data, risk_score, risk_label, var_amount, div_score)
    st.download_button("Download Full Report", report, f"report_{datetime.now().strftime('%Y%m%d')}.txt", "text/plain", use_container_width=True)