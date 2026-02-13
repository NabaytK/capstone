# portfolio.py
# Handles portfolio data - saving/loading holdings, transactions, cost basis
# Each user has their own portfolio file

import json
import os
from datetime import datetime

def get_portfolio_file(username):
    """Get the filename for a user's portfolio"""
    return f"data/{username}_portfolio.json"

def get_transactions_file(username):
    """Get the filename for a user's transactions"""
    return f"data/{username}_transactions.json"

def ensure_data_folder():
    """Make sure the data folder exists"""
    if not os.path.exists("data"):
        os.makedirs("data")

def load_portfolio(username):
    """Load a user's portfolio from file"""
    ensure_data_folder()
    filepath = get_portfolio_file(username)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_portfolio(username, portfolio):
    """Save portfolio data to file"""
    ensure_data_folder()
    filepath = get_portfolio_file(username)
    with open(filepath, 'w') as f:
        json.dump(portfolio, f, indent=2)

def load_transactions(username):
    """Load all transactions for a user"""
    ensure_data_folder()
    filepath = get_transactions_file(username)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_transactions(username, transactions):
    """Save transactions to file"""
    ensure_data_folder()
    filepath = get_transactions_file(username)
    with open(filepath, 'w') as f:
        json.dump(transactions, f, indent=2)

def add_transaction(username, coin_name, coin_id, amount, price_per_coin, transaction_type):
    """
    Add a buy or sell transaction
    transaction_type: 'buy' or 'sell'
    """
    transactions = load_transactions(username)
    
    transaction = {
        'id': len(transactions) + 1,
        'coin_name': coin_name,
        'coin_id': coin_id,
        'amount': amount,
        'price_per_coin': price_per_coin,
        'total_cost': amount * price_per_coin,
        'type': transaction_type,
        'date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    transactions.append(transaction)
    save_transactions(username, transactions)
    
    # Update the portfolio holdings
    update_holdings(username, transactions)
    
    return transaction

def update_holdings(username, transactions):
    """
    Recalculate holdings from all transactions
    This way holdings are always accurate based on buy/sell history
    """
    holdings = {}  # coin_id -> {name, total_amount, total_cost}
    
    for txn in transactions:
        coin_id = txn['coin_id']
        
        if coin_id not in holdings:
            holdings[coin_id] = {
                'name': txn['coin_name'],
                'id': coin_id,
                'total_amount': 0,
                'total_cost': 0,
                'buy_count': 0,
                'sell_count': 0
            }
        
        if txn['type'] == 'buy':
            holdings[coin_id]['total_amount'] += txn['amount']
            holdings[coin_id]['total_cost'] += txn['total_cost']
            holdings[coin_id]['buy_count'] += 1
        elif txn['type'] == 'sell':
            holdings[coin_id]['total_amount'] -= txn['amount']
            # Reduce cost proportionally
            if holdings[coin_id]['total_amount'] > 0:
                avg_cost = holdings[coin_id]['total_cost'] / (holdings[coin_id]['total_amount'] + txn['amount'])
                holdings[coin_id]['total_cost'] -= avg_cost * txn['amount']
            else:
                holdings[coin_id]['total_cost'] = 0
            holdings[coin_id]['sell_count'] += 1
    
    # Convert to list and remove coins with 0 or negative amounts
    portfolio = []
    for coin_id, data in holdings.items():
        if data['total_amount'] > 0:
            portfolio.append({
                'name': data['name'],
                'id': data['id'],
                'amount': data['total_amount'],
                'total_cost': data['total_cost'],
                'avg_cost_basis': data['total_cost'] / data['total_amount'] if data['total_amount'] > 0 else 0
            })
    
    save_portfolio(username, portfolio)
    return portfolio

def calculate_portfolio_value(portfolio, current_prices):
    """
    Calculate total portfolio value and profit/loss for each holding
    current_prices: dict of {coin_id: {'price': float, 'change_24h': float}}
    """
    results = []
    total_value = 0
    total_cost = 0
    
    for holding in portfolio:
        coin_id = holding['id']
        if coin_id in current_prices:
            current_price = current_prices[coin_id]['price']
            change_24h = current_prices[coin_id]['change_24h']
            
            current_value = holding['amount'] * current_price
            cost_basis = holding.get('total_cost', 0)
            profit_loss = current_value - cost_basis
            profit_loss_pct = (profit_loss / cost_basis * 100) if cost_basis > 0 else 0
            
            results.append({
                'name': holding['name'],
                'id': coin_id,
                'amount': holding['amount'],
                'current_price': current_price,
                'current_value': current_value,
                'cost_basis': cost_basis,
                'avg_cost': holding.get('avg_cost_basis', 0),
                'profit_loss': profit_loss,
                'profit_loss_pct': profit_loss_pct,
                'change_24h': change_24h
            })
            
            total_value += current_value
            total_cost += cost_basis
    
    total_pl = total_value - total_cost
    total_pl_pct = (total_pl / total_cost * 100) if total_cost > 0 else 0
    
    return results, total_value, total_cost, total_pl, total_pl_pct

def delete_transaction(username, transaction_id):
    """Delete a transaction by its ID and recalculate holdings"""
    transactions = load_transactions(username)
    transactions = [t for t in transactions if t['id'] != transaction_id]
    save_transactions(username, transactions)
    update_holdings(username, transactions)