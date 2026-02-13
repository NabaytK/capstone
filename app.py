# app.py
# Main application file - this is what Streamlit runs
# All the heavy logic is in the other files, this just handles the UI

import streamlit as st
import pandas as pd
from datetime import datetime

# Import our modules
from auth import check_login, create_account
from api_handler import (
    get_crypto_price, get_multiple_prices, get_historical_prices,
    get_market_data, SUPPORTED_COINS
)
from portfolio import (
    load_portfolio, save_portfolio, load_transactions,
    add_transaction, calculate_portfolio_value, delete_transaction
)
from risk_analysis import (
    calculate_risk_level, calculate_risk_score, calculate_portfolio_risk,
    calculate_var, get_diversification_score, get_recommendations
)
from analytics import (
    create_allocation_pie_chart, create_performance_bar_chart,
    create_price_history_chart, create_risk_gauge,
    create_comparison_chart, create_holdings_value_chart
)
from export_handler import (
    export_portfolio_csv, export_transactions_csv, generate_report_text
)

# ============================================
# PAGE CONFIG
# ============================================
st.set_page_config(
    page_title="Crypto Portfolio Tracker",
    page_icon="💰",
    layout="wide"
)

# ============================================
# CUSTOM CSS - makes it look nicer
# ============================================
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 20px;
    }
    .metric-card {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        margin: 5px 0;
    }
    .risk-low { color: #28a745; font-weight: bold; }
    .risk-medium { color: #ffc107; font-weight: bold; }
    .risk-high { color: #dc3545; font-weight: bold; }
    .profit { color: #28a745; }
    .loss { color: #dc3545; }
</style>
""", unsafe_allow_html=True)

# ============================================
# SESSION STATE SETUP
# ============================================
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'username' not in st.session_state:
    st.session_state.username = ""

# ============================================
# LOGIN / SIGNUP PAGE
# ============================================
if not st.session_state.logged_in:
    st.markdown('<div class="main-header"><h1>💰 Crypto Portfolio Tracker</h1><p>Track, Analyze, and Manage Your Crypto Investments</p></div>', unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["🔑 Login", "📝 Sign Up"])
    
    with tab1:
        username = st.text_input("Username", key="login_user")
        password = st.text_input("Password", type="password", key="login_pass")
        if st.button("Login", use_container_width=True):
            if check_login(username, password):
                st.session_state.logged_in = True
                st.session_state.username = username
                st.success("Login successful!")
                st.rerun()
            else:
                st.error("Wrong username or password")
    
    with tab2:
        new_username = st.text_input("Choose Username", key="signup_user")
        new_password = st.text_input("Choose Password", type="password", key="signup_pass")
        if st.button("Create Account", use_container_width=True):
            success, message = create_account(new_username, new_password)
            if success:
                st.success(message + " Go to Login tab.")
            else:
                st.error(message)
    
    st.stop()

# ============================================
# MAIN APP (after login)
# ============================================

# Header
st.markdown(f'<div class="main-header"><h1>💰 Crypto Portfolio Tracker</h1><p>Welcome back, {st.session_state.username}!</p></div>', unsafe_allow_html=True)

# Sidebar - Logout and Navigation
if st.sidebar.button("🚪 Logout"):
    st.session_state.logged_in = False
    st.session_state.username = ""
    st.rerun()

st.sidebar.markdown("---")

# ============================================
# SIDEBAR - ADD TRANSACTION
# ============================================
st.sidebar.header("📝 Add Transaction")

with st.sidebar.form("add_transaction_form"):
    # Transaction type
    txn_type = st.selectbox("Transaction Type:", ["buy", "sell"])
    
    # Coin selection (20+ coins)
    selected_coin = st.selectbox("Choose Coin:", list(SUPPORTED_COINS.keys()))
    
    # Amount
    amount = st.number_input("Amount of coins:", min_value=0.0, step=0.01, format="%.4f")
    
    # Price input option
    price_option = st.radio("Price:", ["Use current price", "Enter manually"])
    manual_price = st.number_input("Manual price (USD):", min_value=0.0, step=0.01, value=0.0)
    
    submitted = st.form_submit_button("Add Transaction", use_container_width=True)
    
    if submitted and amount > 0:
        coin_id = SUPPORTED_COINS[selected_coin]
        
        if price_option == "Use current price":
            price, _ = get_crypto_price(coin_id)
            if price is None:
                st.error("Could not fetch price. Try again!")
                price = 0
        else:
            price = manual_price
        
        if price > 0:
            txn = add_transaction(
                st.session_state.username,
                selected_coin, coin_id,
                amount, price, txn_type
            )
            st.success(f"Added {txn_type.upper()}: {amount} {selected_coin} @ ${price:,.2f}")
            st.rerun()
        else:
            st.error("Invalid price. Please try again.")

# Clear portfolio button
if st.sidebar.button("🗑️ Clear All Data"):
    save_portfolio(st.session_state.username, [])
    from portfolio import save_transactions
    save_transactions(st.session_state.username, [])
    st.rerun()

# ============================================
# LOAD DATA
# ============================================
portfolio = load_portfolio(st.session_state.username)
transactions = load_transactions(st.session_state.username)

# ============================================
# MAIN CONTENT - TABS
# ============================================
if len(portfolio) == 0:
    st.info("👈 Add some cryptocurrencies using the sidebar to get started!")
    
    # Show market overview even without portfolio
    st.subheader("📊 Market Overview")
    market_data = get_market_data()
    if market_data:
        market_df = pd.DataFrame([{
            'Coin': coin['name'],
            'Price': f"${coin['current_price']:,.2f}",
            '24h Change': f"{coin.get('price_change_percentage_24h', 0):.2f}%",
            'Market Cap': f"${coin.get('market_cap', 0):,.0f}"
        } for coin in market_data[:10]])
        st.dataframe(market_df, use_container_width=True)
else:
    # Get current prices for all holdings
    coin_ids = [h['id'] for h in portfolio]
    current_prices = get_multiple_prices(coin_ids)
    
    # Calculate portfolio values
    holdings_data, total_value, total_cost, total_pl, total_pl_pct = calculate_portfolio_value(
        portfolio, current_prices
    )
    
    # Calculate risk metrics
    risk_score, risk_label, risk_color = calculate_portfolio_risk(holdings_data)
    var_amount = calculate_var(holdings_data)
    div_score, div_recommendation = get_diversification_score(holdings_data)
    recommendations = get_recommendations(holdings_data, risk_score, div_score)
    
    # ========== TABS ==========
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "📊 Dashboard", "💼 Holdings", "📈 Performance",
        "📝 Transactions", "🔍 Risk Analysis", "📋 Export"
    ])
    
    # ========== TAB 1: DASHBOARD ==========
    with tab1:
        # Top metrics row
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Value", f"${total_value:,.2f}")
        with col2:
            st.metric("Total Cost", f"${total_cost:,.2f}")
        with col3:
            pl_delta = f"{total_pl_pct:+.2f}%"
            st.metric("Profit/Loss", f"${total_pl:,.2f}", delta=pl_delta)
        with col4:
            st.metric("Risk Score", f"{risk_score}/100", delta=risk_label)
        
        st.markdown("---")
        
        # Charts row
        col1, col2 = st.columns(2)
        with col1:
            pie_chart = create_allocation_pie_chart(holdings_data)
            if pie_chart:
                st.plotly_chart(pie_chart, use_container_width=True)
        with col2:
            pl_chart = create_performance_bar_chart(holdings_data)
            if pl_chart:
                st.plotly_chart(pl_chart, use_container_width=True)
        
        # Bitcoin comparison
        st.subheader("📈 Bitcoin Benchmark Comparison")
        btc_price, btc_change = get_crypto_price('bitcoin')
        if btc_price and btc_change:
            avg_change = sum(h.get('change_24h', 0) for h in holdings_data) / len(holdings_data)
            
            comparison_chart = create_comparison_chart(avg_change, btc_change)
            st.plotly_chart(comparison_chart, use_container_width=True)
            
            if avg_change > btc_change:
                st.success(f"🎉 Your portfolio is outperforming Bitcoin by {(avg_change - btc_change):.2f}%!")
            else:
                st.warning(f"⚠️ Your portfolio is underperforming Bitcoin by {(btc_change - avg_change):.2f}%")
    
    # ========== TAB 2: HOLDINGS ==========
    with tab2:
        st.subheader("💼 Your Holdings")
        
        # Holdings table
        holdings_table = []
        for h in holdings_data:
            risk_lvl, _ = calculate_risk_level(h.get('change_24h', 0))
            holdings_table.append({
                'Coin': h['name'],
                'Amount': f"{h['amount']:.4f}",
                'Current Price': f"${h['current_price']:,.2f}",
                'Value': f"${h['current_value']:,.2f}",
                'Cost Basis': f"${h.get('cost_basis', 0):,.2f}",
                'Avg Cost': f"${h.get('avg_cost', 0):,.2f}",
                'P/L': f"${h.get('profit_loss', 0):,.2f}",
                'P/L %': f"{h.get('profit_loss_pct', 0):.2f}%",
                '24h Change': f"{h.get('change_24h', 0):.2f}%",
                'Risk': risk_lvl
            })
        
        df = pd.DataFrame(holdings_table)
        st.dataframe(df, use_container_width=True)
        
        # Holdings value chart
        value_chart = create_holdings_value_chart(holdings_data)
        if value_chart:
            st.plotly_chart(value_chart, use_container_width=True)
    
    # ========== TAB 3: PERFORMANCE ==========
    with tab3:
        st.subheader("📈 Performance Timeline")
        
        # Let user pick a coin to see price history
        coin_names = [h['name'] for h in holdings_data]
        selected = st.selectbox("Select coin for price history:", coin_names)
        
        # Find the coin id
        selected_id = None
        for h in holdings_data:
            if h['name'] == selected:
                selected_id = h['id']
                break
        
        if selected_id:
            days = st.selectbox("Time period:", [7, 14, 30, 90], index=2)
            price_history = get_historical_prices(selected_id, days)
            
            if price_history:
                history_chart = create_price_history_chart(price_history, selected)
                st.plotly_chart(history_chart, use_container_width=True)
            else:
                st.warning("Could not load price history. API might be busy.")
        
        # Summary metrics
        st.markdown("---")
        st.subheader("Performance Summary")
        
        perf_cols = st.columns(len(holdings_data))
        for i, h in enumerate(holdings_data):
            with perf_cols[i] if i < len(perf_cols) else st.columns(1)[0]:
                pl_color = "🟢" if h.get('profit_loss', 0) >= 0 else "🔴"
                st.markdown(f"**{h['name']}**")
                st.markdown(f"{pl_color} P/L: ${h.get('profit_loss', 0):,.2f} ({h.get('profit_loss_pct', 0):.1f}%)")
    
    # ========== TAB 4: TRANSACTIONS ==========
    with tab4:
        st.subheader("📝 Transaction History")
        
        if transactions:
            txn_table = []
            for txn in reversed(transactions):  # newest first
                txn_table.append({
                    'ID': txn['id'],
                    'Date': txn['date'],
                    'Type': txn['type'].upper(),
                    'Coin': txn['coin_name'],
                    'Amount': f"{txn['amount']:.4f}",
                    'Price/Coin': f"${txn['price_per_coin']:,.2f}",
                    'Total': f"${txn['total_cost']:,.2f}"
                })
            
            txn_df = pd.DataFrame(txn_table)
            st.dataframe(txn_df, use_container_width=True)
            
            # Delete transaction option
            st.markdown("---")
            del_id = st.number_input("Delete transaction by ID:", min_value=1, step=1)
            if st.button("Delete Transaction"):
                delete_transaction(st.session_state.username, int(del_id))
                st.success(f"Transaction {del_id} deleted!")
                st.rerun()
        else:
            st.info("No transactions yet. Add your first transaction using the sidebar!")
    
    # ========== TAB 5: RISK ANALYSIS ==========
    with tab5:
        st.subheader("🔍 Risk Analysis")
        
        # Risk gauge
        col1, col2 = st.columns(2)
        with col1:
            gauge = create_risk_gauge(risk_score)
            st.plotly_chart(gauge, use_container_width=True)
        
        with col2:
            st.markdown("### Risk Metrics")
            st.markdown(f"**Portfolio Risk Score:** {risk_score}/100 {risk_label}")
            st.markdown(f"**Value at Risk (95%):** ${var_amount:,.2f}")
            st.markdown(f"*This means there's a 5% chance you could lose ${var_amount:,.2f} or more in a single day*")
            st.markdown(f"**Diversification Score:** {div_score}/100")
            st.markdown(f"*{div_recommendation}*")
        
        # Individual coin risk
        st.markdown("---")
        st.subheader("Individual Asset Risk")
        
        risk_table = []
        for h in holdings_data:
            score = calculate_risk_score(h.get('change_24h', 0))
            level, color = calculate_risk_level(h.get('change_24h', 0))
            weight = (h['current_value'] / total_value * 100) if total_value > 0 else 0
            risk_table.append({
                'Coin': h['name'],
                'Weight': f"{weight:.1f}%",
                '24h Volatility': f"{abs(h.get('change_24h', 0)):.2f}%",
                'Risk Score': f"{score}/100",
                'Risk Level': level
            })
        
        risk_df = pd.DataFrame(risk_table)
        st.dataframe(risk_df, use_container_width=True)
        
        # Recommendations
        st.markdown("---")
        st.subheader("📋 Recommendations")
        for rec in recommendations:
            st.markdown(f"- {rec}")
    
    # ========== TAB 6: EXPORT ==========
    with tab6:
        st.subheader("📋 Export Data")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### Portfolio CSV")
            csv_data = export_portfolio_csv(holdings_data)
            st.download_button(
                label="📥 Download Portfolio CSV",
                data=csv_data,
                file_name=f"portfolio_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv",
                use_container_width=True
            )
        
        with col2:
            st.markdown("### Transactions CSV")
            if transactions:
                txn_csv = export_transactions_csv(transactions)
                st.download_button(
                    label="📥 Download Transactions CSV",
                    data=txn_csv,
                    file_name=f"transactions_{datetime.now().strftime('%Y%m%d')}.csv",
                    mime="text/csv",
                    use_container_width=True
                )
            else:
                st.info("No transactions to export")
        
        # Text report
        st.markdown("---")
        st.markdown("### Portfolio Report")
        report = generate_report_text(holdings_data, risk_score, risk_label, var_amount, div_score)
        st.text(report)
        st.download_button(
            label="📥 Download Report",
            data=report,
            file_name=f"report_{datetime.now().strftime('%Y%m%d')}.txt",
            mime="text/plain",
            use_container_width=True
        )

# ============================================
# FOOTER
# ============================================
st.sidebar.markdown("---")
st.sidebar.info("💰 Crypto Portfolio Tracker\nGraduation Project - Spring 2026")