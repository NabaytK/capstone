import streamlit as st
import requests
import pandas as pd
from datetime import datetime

# Set page configuration
st.set_page_config(
    page_title="Crypto Portfolio Tracker",
    page_icon="💰",
    layout="wide"
)

# Title
st.title("💰 My Crypto Portfolio Tracker")
st.write("Track your cryptocurrency investments and see how they compare to Bitcoin!")

# Sidebar for adding coins
st.sidebar.header("Add Your Coins")

# Simple function to get crypto price from CoinGecko
def get_crypto_price(coin_id):
    """Get current price of a cryptocurrency"""
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd&include_24h_change=true"
        response = requests.get(url)
        data = response.json()
        return data[coin_id]['usd'], data[coin_id]['usd_24h_change']
    except:
        return None, None

# Simple function to calculate risk level
def calculate_risk(volatility):
    """Calculate risk level based on 24h price change"""
    abs_volatility = abs(volatility)
    
    if abs_volatility < 3:
        return "🟢 Low Risk", "green"
    elif abs_volatility < 7:
        return "🟡 Medium Risk", "orange"
    else:
        return "🔴 High Risk", "red"

# Initialize session state for portfolio
if 'portfolio' not in st.session_state:
    st.session_state.portfolio = []

# Add coin form in sidebar
with st.sidebar.form("add_coin_form"):
    st.write("### Add a Cryptocurrency")
    
    # Simple dropdown with popular coins
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
            st.success(f"Added {amount} {selected_coin}!")
        else:
            st.error("Could not fetch price. Try again!")

# Clear portfolio button
if st.sidebar.button("Clear All"):
    st.session_state.portfolio = []
    st.rerun()

# Main content area
if len(st.session_state.portfolio) == 0:
    st.info("👈 Add some cryptocurrencies to your portfolio using the sidebar!")
else:
    # Calculate total portfolio value
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
    
    # Display total value
    st.metric("Total Portfolio Value", f"${total_value:,.2f}")
    
    # Display portfolio table
    st.subheader("📊 Your Holdings")
    df = pd.DataFrame(portfolio_data)
    st.dataframe(df, use_container_width=True)
    
    # Bitcoin comparison
    st.subheader("📈 Compare with Bitcoin")
    btc_price, btc_change = get_crypto_price('bitcoin')
    
    if btc_price and btc_change:
        col1, col2 = st.columns(2)
        
        with col1:
            st.metric("Bitcoin Price", f"${btc_price:,.2f}", f"{btc_change:.2f}%")
        
        with col2:
            # Calculate if portfolio is doing better than Bitcoin
            avg_portfolio_change = sum([coin['change_24h'] for coin in st.session_state.portfolio]) / len(st.session_state.portfolio)
            
            if avg_portfolio_change > btc_change:
                st.success(f"🎉 Your portfolio is outperforming Bitcoin by {(avg_portfolio_change - btc_change):.2f}%!")
            else:
                st.warning(f"⚠️ Your portfolio is underperforming Bitcoin by {(btc_change - avg_portfolio_change):.2f}%")

# Footer
st.sidebar.markdown("---")
st.sidebar.info("💡 This is a simple portfolio tracker for your graduation project!")
