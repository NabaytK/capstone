# Understanding the Code - Study Guide

## Project Structure

The project is split into separate files so each file handles one thing:

| File | What It Does |
|------|-------------|
| `app.py` | Main UI - what the user sees (tabs, buttons, layout) |
| `auth.py` | Login and signup - checking passwords |
| `api_handler.py` | Gets crypto prices from CoinGecko API |
| `portfolio.py` | Manages portfolio data - buy/sell, cost basis, P/L |
| `risk_analysis.py` | All the risk math - scores, VaR, diversification |
| `analytics.py` | Creates all the charts using Plotly |
| `export_handler.py` | Exports data to CSV files |

## Key Concepts

### 1. How Transactions Work (portfolio.py)
When you buy or sell crypto, it gets saved as a transaction. The portfolio is recalculated from ALL transactions every time:

```python
# Example: Buy 2 Bitcoin at $50,000 each
transaction = {
    'type': 'buy',
    'coin_name': 'Bitcoin',
    'amount': 2,
    'price_per_coin': 50000,
    'total_cost': 100000  # 2 × $50,000
}
```

### 2. Cost Basis Calculation
Cost basis = total money you spent buying a coin
Average cost = total cost / amount of coins you have

If you bought 2 BTC at $50,000 and 1 BTC at $60,000:
- Total cost = $100,000 + $60,000 = $160,000
- Total coins = 3
- Average cost = $160,000 / 3 = $53,333.33

### 3. Risk Score (risk_analysis.py)
The risk score uses weighted volatility:

```python
# For each coin in portfolio:
weight = coin_value / total_portfolio_value
weighted_volatility += weight * abs(coin_24h_change)

# Map to 0-100 score
risk_score = weighted_volatility / 15 * 100
```

**Example**: Portfolio has 60% Bitcoin (3% change) and 40% Ethereum (5% change)
- Weighted vol = 0.60 × 3 + 0.40 × 5 = 1.8 + 2.0 = 3.8
- Risk score = 3.8 / 15 × 100 = 25.3 (Low Risk)

### 4. Value at Risk (VaR)
VaR answers: "What's the most I could lose in one day (95% confidence)?"

```python
VaR = portfolio_value × 1.645 × weighted_volatility
```

The 1.645 is the z-score for 95% confidence (from statistics).

### 5. Diversification Score
Uses the Herfindahl-Hirschman Index (HHI):
- If one coin = 100% of portfolio → HHI = 1 (bad)
- If 4 coins = 25% each → HHI = 0.25 (good)

We convert this to a 0-100 score where higher = better diversified.

### 6. API Caching (api_handler.py)
We save prices to a file so we don't call the API too much:
```python
# Before calling API, check if we have a recent price saved
if price was saved less than 60 seconds ago:
    use the saved price  # faster, no API call needed
else:
    call the API and save the new price
```

### 7. Password Hashing (auth.py)
We don't store passwords as plain text. We hash them:
```python
# "password123" becomes "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
# You can't reverse a hash back to the original password
```

## Tips for Your Presentation

1. **Explain the file structure**: "I organized the code into modules for maintainability"
2. **Explain the risk calculation**: "We use weighted volatility across all holdings"
3. **Explain VaR**: "Value at Risk tells us worst-case daily loss at 95% confidence"
4. **Explain the benchmark**: "We compare portfolio's average 24h change to Bitcoin's"
5. **Be honest**: This uses statistical analysis, not actual AI/ML models
6. **Show the charts**: The interactive Plotly charts are impressive for a demo