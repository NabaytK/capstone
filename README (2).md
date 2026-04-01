 Crypto Coin - Graduation Capstone Project

A cryptocurrency portfolio management application with risk analysis, performance tracking, and Bitcoin benchmark comparison.

 Project Structure


##crypto_coin/
├── app.py              # Main entry point (routing + sidebar only)
├── auth.py             # Authentication (email, salted PBKDF2 hashing, sessions)
├── api_handler.py      # CoinGecko API integration with caching
├── portfolio.py        # Portfolio & transaction management, cost basis, P/L
├── risk_analysis.py    # Risk scoring, VaR, diversification analysis
├── analytics.py        # Plotly chart generation
├── pages.py            # All tab/page UI content
├── ui_theme.py         # CSS dark theme and Plotly theme
├── export_handler.py   # CSV and report export
├── requirements.txt    # Python dependencies
└── .gitignore
```

 How to Run

```bash
pip install -r requirements.txt
streamlit run app.py
```

 Features

 Authentication
- Email-based registration with validation
- PBKDF2-SHA256 password hashing with random salt (100,000 iterations)
- Password strength requirements and visual indicator
- Confirm password field
- Session token management

 Portfolio Management
- Buy/sell transaction tracking with timestamps
- Cost basis and average cost per coin
- Profit/Loss per asset and total
- Support for 22 cryptocurrencies

 Analytics Dashboard
- Asset allocation donut chart
- Profit/Loss bar chart
- Bitcoin benchmark comparison
- Price history timeline (7/14/30/90 days)
- Live market overview with top 10 coins

 Risk Analysis
- Weighted portfolio risk score (0-100)
- Value at Risk (VaR) at 95% confidence
- Diversification score (HHI-based)
- Per-asset risk levels
- Automated recommendations

 Data Export
- Portfolio CSV, Transactions CSV, Full text report

 Technical Details

- Language: Python 3
- Framework: Streamlit
- API: CoinGecko (free, no key needed)
- Charts: Plotly
- Storage: JSON files with hashed passwords


