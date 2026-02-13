# api_handler.py
# This file handles all the API calls to CoinGecko
# We keep API stuff separate so its easier to change later if needed

import requests
import json
import os
from datetime import datetime

# Cache file to store prices so we dont hit the API too much
CACHE_FILE = "price_cache.json"
CACHE_DURATION = 60  # seconds before cache expires

# All the coins we support (20+ cryptocurrencies)
SUPPORTED_COINS = {
    "Bitcoin": "bitcoin",
    "Ethereum": "ethereum",
    "Cardano": "cardano",
    "Solana": "solana",
    "Ripple (XRP)": "ripple",
    "Dogecoin": "dogecoin",
    "Polkadot": "polkadot",
    "Chainlink": "chainlink",
    "Avalanche": "avalanche-2",
    "Polygon (MATIC)": "matic-network",
    "Litecoin": "litecoin",
    "Uniswap": "uniswap",
    "Stellar": "stellar",
    "Cosmos": "cosmos",
    "Tron": "tron",
    "Near Protocol": "near",
    "Algorand": "algorand",
    "VeChain": "vechain",
    "Fantom": "fantom",
    "Aave": "aave",
    "Tezos": "tezos",
    "The Sandbox": "the-sandbox",
}

def load_cache():
    """Load cached prices from file"""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_cache(cache_data):
    """Save prices to cache file"""
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache_data, f)

def is_cache_valid(cache_data, coin_id):
    """Check if cached price is still fresh (not expired)"""
    if coin_id in cache_data:
        cached_time = cache_data[coin_id].get('timestamp', 0)
        now = datetime.now().timestamp()
        if now - cached_time < CACHE_DURATION:
            return True
    return False

def get_crypto_price(coin_id):
    """
    Get the current price and 24h change for a cryptocurrency
    Uses cache to avoid hitting the API too much
    Returns: (price, change_24h) or (None, None) if error
    """
    # Check cache first
    cache = load_cache()
    if is_cache_valid(cache, coin_id):
        cached = cache[coin_id]
        return cached['price'], cached['change_24h']
    
    # If not cached or expired, fetch from API
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price"
        params = {
            'ids': coin_id,
            'vs_currencies': 'usd',
            'include_24hr_change': 'true'
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        price = data[coin_id]['usd']
        change = data[coin_id]['usd_24h_change']
        
        # Save to cache
        cache[coin_id] = {
            'price': price,
            'change_24h': change,
            'timestamp': datetime.now().timestamp()
        }
        save_cache(cache)
        
        return price, change
    except Exception as e:
        print(f"API Error for {coin_id}: {e}")
        return None, None

def get_multiple_prices(coin_ids):
    """
    Get prices for multiple coins at once (more efficient)
    coin_ids: list of coin id strings like ['bitcoin', 'ethereum']
    Returns: dictionary with coin data
    """
    try:
        ids_string = ','.join(coin_ids)
        url = f"https://api.coingecko.com/api/v3/simple/price"
        params = {
            'ids': ids_string,
            'vs_currencies': 'usd',
            'include_24hr_change': 'true'
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        results = {}
        for coin_id in coin_ids:
            if coin_id in data:
                results[coin_id] = {
                    'price': data[coin_id]['usd'],
                    'change_24h': data[coin_id].get('usd_24h_change', 0)
                }
        return results
    except Exception as e:
        print(f"API Error: {e}")
        return {}

def get_historical_prices(coin_id, days=30):
    """
    Get historical price data for charts
    Returns list of [timestamp, price] pairs
    """
    try:
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
        params = {
            'vs_currency': 'usd',
            'days': days
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        return data.get('prices', [])
    except Exception as e:
        print(f"Historical data error: {e}")
        return []

def get_market_data():
    """
    Get top crypto market overview data
    Returns list of coin market data
    """
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': 10,
            'page': 1,
            'sparkline': 'false'
        }
        response = requests.get(url, params=params, timeout=10)
        return response.json()
    except Exception as e:
        print(f"Market data error: {e}")
        return []