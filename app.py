# app.py
# Main entry point for Crypto Coin
# Handles login, sidebar, and tab routing
# All page content is in pages.py, styling in ui_theme.py

import streamlit as st

from auth import check_login, create_account, get_user_display_name
from api_handler import get_crypto_price, get_multiple_prices, SUPPORTED_COINS
from portfolio import (
    load_portfolio, save_portfolio, load_transactions,
    add_transaction, calculate_portfolio_value, save_transactions
)
from risk_analysis import (
    calculate_portfolio_risk, calculate_var,
    get_diversification_score, get_recommendations
)
from ui_theme import apply_theme
from pages import (
    render_empty_state, render_hero, render_risk_card, render_quick_stats,
    render_dashboard, render_holdings, render_performance,
    render_transactions, render_analytics, render_export
)

# ============================================
# PAGE CONFIG
# ============================================
st.set_page_config(
    page_title="Crypto Coin",
    page_icon="🪙",
    layout="wide",
    initial_sidebar_state="expanded"
)

apply_theme()

# ============================================
# SESSION STATE
# ============================================
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'username' not in st.session_state:
    st.session_state.username = ""
if 'session_token' not in st.session_state:
    st.session_state.session_token = None

# ============================================
# LOGIN / SIGN UP
# ============================================
if not st.session_state.logged_in:
    col1, col_mid, col2 = st.columns([1, 1.5, 1])
    with col_mid:
        st.markdown("""
        <div style="text-align:center; margin-top:40px; margin-bottom:10px;">
            <span style="font-size:3rem;">🪙</span>
        </div>
        <div class="login-title">Crypto Coin</div>
        <div class="login-sub">Track your crypto. Understand your risk.</div>
        """, unsafe_allow_html=True)
        
        tab_login, tab_signup = st.tabs(["🔑 Sign In", "📝 Create Account"])
        
        with tab_login:
            st.markdown('<div class="login-box">', unsafe_allow_html=True)
            login_user = st.text_input("Username", key="login_user", placeholder="Enter your username")
            login_pass = st.text_input("Password", type="password", key="login_pass", placeholder="Enter your password")
            if st.button("Sign In", use_container_width=True, key="login_btn"):
                success, result = check_login(login_user, login_pass)
                if success:
                    st.session_state.logged_in = True
                    st.session_state.username = login_user.lower()
                    st.session_state.session_token = result
                    st.rerun()
                else:
                    st.error(result)
            st.markdown('</div>', unsafe_allow_html=True)
        
        with tab_signup:
            st.markdown('<div class="login-box">', unsafe_allow_html=True)
            signup_user = st.text_input("Username", key="signup_user", placeholder="Letters & numbers only")
            signup_email = st.text_input("Email Address", key="signup_email", placeholder="your@email.com")
            signup_pass = st.text_input("Password", type="password", key="signup_pass", placeholder="Min 6 chars, include a number")
            signup_confirm = st.text_input("Confirm Password", type="password", key="signup_confirm", placeholder="Re-enter password")
            
            # Password strength
            if signup_pass:
                s = sum([len(signup_pass) >= 6, any(c.isdigit() for c in signup_pass),
                         any(c.isupper() for c in signup_pass), len(signup_pass) >= 10])
                cls = "pw-weak" if s <= 1 else ("pw-ok" if s <= 2 else "pw-strong")
                dots = "●" * max(s, 1)
                label = "Weak" if s <= 1 else ("Fair" if s <= 2 else "Strong")
                st.markdown(f'<div class="{cls}">{dots} {label} password</div>', unsafe_allow_html=True)
            
            if st.button("Create Account", use_container_width=True, key="signup_btn"):
                success, msg = create_account(signup_user, signup_email, signup_pass, signup_confirm)
                if success:
                    st.success(msg + " Switch to Sign In tab.")
                else:
                    st.error(msg)
            st.markdown('</div>', unsafe_allow_html=True)
    
    st.stop()

# ============================================
# SIDEBAR (logged in)
# ============================================
display_name = get_user_display_name(st.session_state.username)

st.sidebar.markdown(f"""
<div style="padding:12px 0; border-bottom:1px solid #262626; margin-bottom:16px;">
    <div style="color:#fff; font-weight:600; font-size:1.1rem;">🪙 Crypto Coin</div>
    <div style="color:#a3a3a3; font-size:0.8rem; margin-top:2px;">
        Signed in as <span style="color:#22d3ee;">{display_name}</span>
    </div>
</div>
""", unsafe_allow_html=True)

if st.sidebar.button("🚪 Sign Out", use_container_width=True):
    st.session_state.logged_in = False
    st.session_state.username = ""
    st.session_state.session_token = None
    st.rerun()

st.sidebar.markdown("---")
st.sidebar.markdown("### 📝 Add Transaction")

with st.sidebar.form("add_txn"):
    txn_type = st.selectbox("Type", ["buy", "sell"])
    selected_coin = st.selectbox("Coin", list(SUPPORTED_COINS.keys()))
    amount = st.number_input("Amount", min_value=0.0, step=0.01, format="%.4f")
    price_option = st.radio("Price", ["Use current price", "Enter manually"], horizontal=True)
    manual_price = st.number_input("Manual price (USD)", min_value=0.0, step=0.01, value=0.0)
    submitted = st.form_submit_button("Add Transaction", use_container_width=True)
    
    if submitted and amount > 0:
        coin_id = SUPPORTED_COINS[selected_coin]
        if price_option == "Use current price":
            price, _ = get_crypto_price(coin_id)
            if price is None:
                st.error("Could not fetch price")
                price = 0
        else:
            price = manual_price
        if price > 0:
            add_transaction(st.session_state.username, selected_coin, coin_id, amount, price, txn_type)
            st.success(f"✅ {txn_type.upper()}: {amount} {selected_coin} @ ${price:,.2f}")
            st.rerun()

if st.sidebar.button("🗑️ Clear All Data", use_container_width=True):
    save_portfolio(st.session_state.username, [])
    save_transactions(st.session_state.username, [])
    st.rerun()

# ============================================
# MAIN CONTENT
# ============================================
portfolio = load_portfolio(st.session_state.username)
transactions = load_transactions(st.session_state.username)

if len(portfolio) == 0:
    render_empty_state()
else:
    # Calculate everything
    coin_ids = [h['id'] for h in portfolio]
    current_prices = get_multiple_prices(coin_ids)
    holdings_data, total_value, total_cost, total_pl, total_pl_pct = calculate_portfolio_value(portfolio, current_prices)
    risk_score, risk_label, risk_color = calculate_portfolio_risk(holdings_data)
    var_amount = calculate_var(holdings_data)
    div_score, div_recommendation = get_diversification_score(holdings_data)
    recommendations = get_recommendations(holdings_data, risk_score, div_score)
    
    # Hero + Risk + Stats
    render_hero(total_value, total_pl, total_pl_pct)
    render_risk_card(risk_score, risk_label)
    render_quick_stats(holdings_data, total_value, var_amount)
    
    # Tabs
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "🏠 Dashboard", "💼 Portfolio", "📈 Performance",
        "📝 Transactions", "📊 Analytics", "📋 Export"
    ])
    
    with tab1:
        render_dashboard(holdings_data, recommendations)
    with tab2:
        render_holdings(holdings_data)
    with tab3:
        render_performance(holdings_data)
    with tab4:
        render_transactions(transactions, st.session_state.username)
    with tab5:
        render_analytics(holdings_data, risk_score, risk_label, var_amount, div_score, div_recommendation, recommendations, total_value)
    with tab6:
        render_export(holdings_data, transactions, risk_score, risk_label, var_amount, div_score)

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown('<div style="color:#525252;font-size:0.75rem;text-align:center;padding:8px 0;">Crypto Coin © 2026<br>Track your crypto. Understand your risk.</div>', unsafe_allow_html=True)