# 💰 Crypto Portfolio Tracker - Graduation Project

A simple cryptocurrency portfolio management application built with Python and Streamlit.

## What This App Does

1. **Track Your Crypto**: Add cryptocurrencies and see their current value
2. **Risk Assessment**: Shows if each coin is Low, Medium, or High risk based on 24-hour price changes
3. **Bitcoin Comparison**: See if your portfolio is doing better or worse than Bitcoin

## How to Run

### Step 1: Install Python
Make sure you have Python 3.8 or higher installed on your computer.

### Step 2: Install Dependencies
Open terminal in this folder and run:
```bash
pip install -r requirements.txt
```

### Step 3: Run the App
In terminal, type:
```bash
streamlit run app.py
```

The app will open in your web browser automatically!

## How to Use the App

1. Use the **sidebar** on the left to add cryptocurrencies
2. Choose a coin from the dropdown
3. Enter how many coins you own
4. Click "Add to Portfolio"
5. See your portfolio value and risk levels!

## Project Features

✅ Real-time cryptocurrency prices (CoinGecko API)  
✅ Simple risk calculation (Low/Medium/High based on volatility)  
✅ Bitcoin benchmark comparison  
✅ Clean, easy-to-use interface  

## Technical Details

- **Language**: Python 3
- **Framework**: Streamlit (for web interface)
- **API**: CoinGecko (free, no API key needed)
- **Data**: Pandas (for organizing data)

## Notes for Presentation

- This is a **web application** that works on any device with a browser
- The risk calculation uses **24-hour price volatility**:
  - Less than 3% change = Low Risk
  - 3-7% change = Medium Risk
  - More than 7% change = High Risk
- Bitcoin comparison shows if your portfolio beats the market benchmark

## Future Improvements (Optional)

- Add historical price charts
- Save portfolio data to a file
- Add more cryptocurrencies
- Create profit/loss calculations

---

**Created for**: Graduation Capstone Project  
**Semester**: Spring 2026  
**Timeline**: 16 weeks
