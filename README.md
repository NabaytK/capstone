# 💰 Crypto Portfolio Tracker - Graduation Project

A cryptocurrency portfolio management application built with Python and Streamlit featuring risk analysis, performance tracking, and Bitcoin benchmark comparison.

## What This App Does

1. **Track Your Crypto**: Add buy/sell transactions and see current portfolio value
2. **Risk Assessment**: Portfolio risk scoring using weighted volatility analysis and Value at Risk (VaR)
3. **Bitcoin Benchmark**: Compare your portfolio performance against Bitcoin
4. **Analytics Dashboard**: Interactive charts for asset allocation, profit/loss, and price history
5. **Data Export**: Download portfolio and transaction data as CSV

## Project Structure

```
crypto_tracker/
├── app.py              # Main application (UI and layout)
├── auth.py             # User authentication (login/signup)
├── api_handler.py      # CoinGecko API integration and caching
├── portfolio.py        # Portfolio and transaction management
├── risk_analysis.py    # Risk calculations (scores, VaR, diversification)
├── analytics.py        # Charts and visualizations (Plotly)
├── export_handler.py   # CSV and report export
├── requirements.txt    # Python dependencies
├── README.md           # This file
├── LEARNING_NOTES.md   # Code explanations for studying
├── GITHUB_SETUP.md     # How to push to GitHub
└── .gitignore          # Files to ignore in Git
```

## How to Run

### Step 1: Install Python
Make sure you have Python 3.8 or higher installed.

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run the App
```bash
streamlit run app.py
```

The app will open in your browser automatically!

## Features

### Core Features
- User authentication (login/signup with hashed passwords)
- Buy/sell transaction tracking with date stamps
- Real-time portfolio valuation using CoinGecko API
- Cost basis and average cost per coin calculation
- Profit/Loss per asset and total portfolio
- Support for 20+ cryptocurrencies

### Analytics Dashboard
- Portfolio summary metrics (total value, cost, P/L)
- Asset allocation pie chart
- Profit/Loss bar chart by asset
- Price history timeline charts (7/14/30/90 days)
- Holdings value comparison chart
- Bitcoin benchmark comparison chart

### Risk Analysis
- Portfolio risk score (0-100 scale using weighted volatility)
- Individual asset risk levels (Low/Medium/High)
- Value at Risk (VaR) at 95% confidence
- Diversification score using HHI concentration index
- Automated recommendations based on risk and diversification

### Data Export
- Portfolio holdings CSV export
- Transaction history CSV export
- Text-based portfolio report

## Technical Details

- **Language**: Python 3
- **Framework**: Streamlit (web interface)
- **API**: CoinGecko (free, no API key needed)
- **Charts**: Plotly (interactive visualizations)
- **Data**: Pandas (data organization)
- **Storage**: JSON files (user data and portfolio)

## Risk Calculation Methodology

The risk assessment uses statistical analysis of price volatility:

- **Risk Score**: Weighted portfolio volatility mapped to 0-100 scale
  - Each coin's weight = its value / total portfolio value
  - Weighted volatility = sum of (weight × coin volatility) for all coins
- **Risk Levels**: Low (<30), Medium (30-60), High (>60)
- **Value at Risk**: VaR = Portfolio Value × Z-score (1.645) × Weighted Volatility
- **Diversification**: Herfindahl-Hirschman Index (HHI) converted to 0-100 score

## Notes for Presentation

- The "AI/ML" component is the risk scoring algorithm using statistical calculations
- The app uses weighted volatility analysis, not actual machine learning models
- Bitcoin comparison shows if portfolio beats the market benchmark (24h change)
- All prices come from CoinGecko's free API with caching to reduce API calls

---

**Created for**: Graduation Capstone Project  
**Semester**: Spring 2026  
**Timeline**: 16 weeks (January 23 - May 9, 2026)