# Test Your Understanding - Simple Quiz

## Questions About the Code

### 1. What does `get_crypto_price()` function do?
- It connects to CoinGecko API
- Gets the current price of a cryptocurrency
- Also gets the 24-hour price change
- Returns both values

### 2. How does the Risk Calculator work?
```python
def calculate_risk(volatility):
    abs_volatility = abs(volatility)  # Get absolute value (remove negative sign)
    
    if abs_volatility < 3:
        return "Low Risk"
    elif abs_volatility < 7:
        return "Medium Risk"
    else:
        return "High Risk"
```

**Example**: If Bitcoin changed by -5% in 24 hours:
- abs(-5) = 5
- 5 is between 3 and 7
- So it's "Medium Risk"

### 3. What is `st.session_state.portfolio`?
- It's like a memory box that stores your portfolio data
- When you add coins, they go here
- When you refresh the page, they stay here (during that session)

### 4. What does this line do?
```python
total_value += value
```
- `+=` means "add to existing value"
- It's the same as: `total_value = total_value + value`
- It adds up all your coin values to get total portfolio value

## Key Python Concepts Used

1. **Functions**: Reusable blocks of code
   - `def function_name():`
   - Makes code organized and easy to read

2. **Dictionaries**: Store data with names
   - `{'name': 'Bitcoin', 'price': 50000}`
   - Like a real dictionary: word → definition

3. **Lists**: Store multiple items
   - `[item1, item2, item3]`
   - Can add items: `list.append(new_item)`

4. **If/Elif/Else**: Make decisions
   - If this is true, do this
   - Else if that is true, do that
   - Otherwise, do something else

5. **Loops**: Repeat actions
   - `for coin in portfolio:` means "for each coin in portfolio"
   - Does something with each coin

## Practice Exercise

Try modifying the risk levels:
- Change `< 3` to `< 5` for Low Risk
- Change `< 7` to `< 10` for Medium Risk
- See how it changes the risk assessment!

## Tips for Your Presentation

1. **Explain the API**: "We use CoinGecko's free API to get real-time prices"
2. **Explain the Risk Calculation**: "We look at 24-hour price changes to determine volatility"
3. **Explain the Benchmark**: "We compare your portfolio's average change to Bitcoin"
4. **Keep it Simple**: Don't try to sound super technical - just explain what it does!
