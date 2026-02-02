import streamlit as st
import requests
import pandas as pd
from datetime import datetime
import json
import os
import matplotlib.pyplot as plt

st.set_page_config(
    page_title="Crypto Portfolio Tracker",
    page_icon="💰",
    layout="wide"
)

def check_login(username, password):
    if os.path.exists('users.json'):
        with open('users.json', 'r') as f:
            users = json.load(f)
            if username in users and users[username] == password:
                return True
    return False

def save_user(username, password):
    users = {}
    if os.path.exists('users.json'):
        with open('users.json', 'r') as f:
            users = json.load(f)
    users[username] = password
    with open('users.json', 'w') as f:
        json.dump(users, f)

def save_portfolio_to_file(username, portfolio):
    filename = f"{username}_portfolio.json"
    with open(filename, 'w') as f:
        json.dump(portfolio, f)

def load_portfolio_from_file(username):
    filename = f"{username}_portfolio.json"
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return []

if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False

if not st.session_state.logged_in:
    st.title("💰 Crypto Portfolio Tracker")
    st.subheader("Login or Sign Up")
    tab1, tab2 = st.tabs(["Login", "Sign Up"])
    with tab1:
        username = st.text_input("Username", key="login_user")
        password = st.text_input("Password", type="password", key="login_pass")
        if st.button("Login"):
            if check_login(username, password):
                st.session_state.logged_in = True
                st.session_state.username = username
                st.session_state.portfolio = load_portfolio_from_file(username)
                st.success("Login successful!")
                st.rerun()
            else:
                st.error("Wrong username or password")
    with tab2:
        new_username = st.text_input("Choose Username", key="signup_user")
        new_password = st.text_input("Choose Password", type="password", key="signup_pass")
        if st.button("Sign Up"):
            if new_username and new_password:
                save_user(new_username, new_password)
                st.success("Account created! Go to Login tab")
            else:
                st.error("Please fill all fields")
    st.stop()

st.title("💰 My Crypto Portfolio Tracker")
st.write(f"Welcome back, {st.session_state.username}!")

if st.sidebar.button("Logout"):
    st.session_state.logged_in = False
    st.rerun()

st.sidebar.header("Add Your Coins")

def get_crypto_price(coin_id):
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd&include_24h_change=true"
        response = requests.get(url)
        data = response.json()
        return data[coin_id]['usd'], data[coin_id]['usd_24h_change']
    except:
        return None, None

def calculate_risk(volatility):
    abs_vol = abs(volatility)
    if abs_vol < 3:
        return "🟢 Low Risk", "green"
    elif abs_vol < 7:
        return "🟡 Medium Risk", "orange"
    else:
        return "🔴 High Risk", "red"

if 'portfolio' not in st.session_state:
    st.session_state.portfolio = load_portfolio_from_file(st.session_state.username)

with st.sidebar.form("add_coin_form"):
    st.write("### Add a Cryptocurrency")
    coin_options = {
        "Bitcoin": "bitcoin",
        "Ethereum": "ethereum",
        "Cardano": "cardano",
        "Solana": "solana",
        "Ripple": "ripple",
        "Dogecoin": "dogecoin",
        "Polkadot": "polkadot"
    }
    selected_coin = st.selectbox("Choose Coin:", list(coin_options.keys()))
    amount = st.number_input("How many coins do you own?", min_value=0.0, step=0.1)
    submitted = st.form_submit_button("Add to Portfolio")
    if submitted and amount > 0:
        coin_id = coin_options[selected_coin]
        price, change = get_crypto_price(coin_id)
        if price:
            st.session_state.portfolio.append({
                'name': selected_coin,
                'id': coin_id,
                'amount': amount,
                'price': price,
                'change_24h': change
            })
            save_portfolio_to_file(st.session_state.username, st.session_state.portfolio)
            st.success(f"Added {amount} {selected_coin}!")
        else:
            st.error("Could not fetch price. Try again!")

if st.sidebar.button("Clear All"):
    st.session_state.portfolio = []
    save_portfolio_to_file(st.session_state.username, [])
    st.rerun()

if len(st.session_state.portfolio) == 0:
    st.info("👈 Add some cryptocurrencies to your portfolio using the sidebar!")
else:
    total_value = 0
    portfolio_data = []
    for coin in st.session_state.portfolio:
        value = coin['amount'] * coin['price']
        total_value += value
        risk_label, risk_color = calculate_risk(coin['change_24h'])
        portfolio_data.append({
            'Coin': coin['name'],
            'Amount': coin['amount'],
            'Price (USD)': f"${coin['price']:,.2f}",
            'Value (USD)': f"${value:,.2f}",
            '24h Change': f"{coin['change_24h']:.2f}%",
            'Risk Level': risk_label
        })
    st.metric("Total Portfolio Value", f"${total_value:,.2f}")
    st.subheader("📊 Your Holdings")
    df = pd.DataFrame(portfolio_data)
    st.dataframe(df, use_container_width=True)
    st.subheader("📈 Asset Allocation")
    coin_names = []
    coin_values = []
    for coin in st.session_state.portfolio:
        coin_names.append(coin['name'])
        value = coin['amount'] * coin['price']
        coin_values.append(value)
    fig, ax = plt.subplots()
    ax.pie(coin_values, labels=coin_names, autopct='%1.1f%%', startangle=90)
    ax.axis('equal')
    st.pyplot(fig)
    st.subheader("📈 Compare with Bitcoin")
    btc_price, btc_change = get_crypto_price('bitcoin')
    if btc_price and btc_change:
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Bitcoin Price", f"${btc_price:,.2f}", f"{btc_change:.2f}%")
        with col2:
            avg_portfolio_change = sum([coin['change_24h'] for coin in st.session_state.portfolio]) / len(st.session_state.portfolio)
            if avg_portfolio_change > btc_change:
                st.success(f"🎉 Your portfolio is outperforming Bitcoin by {(avg_portfolio_change - btc_change):.2f}%!")
            else:
                st.warning(f"⚠️ Your portfolio is underperforming Bitcoin by {(btc_change - avg_portfolio_change):.2f}%")

st.sidebar.markdown("---")
st.sidebar.info("💡 This is a simple portfolio tracker for your graduation project!")
