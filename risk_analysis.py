# risk_analysis.py
# Handles all risk-related calculations
# This is the "AI/ML" component of the project
# (really its just statistical analysis but it sounds cool)

import math

def calculate_risk_level(volatility):
    """
    Determine risk level based on 24h price volatility
    volatility: the 24-hour percentage change
    Returns: (risk_label, risk_color)
    """
    abs_vol = abs(volatility)
    if abs_vol < 3:
        return "🟢 Low Risk", "green"
    elif abs_vol < 7:
        return "🟡 Medium Risk", "orange"
    else:
        return "🔴 High Risk", "red"

def calculate_risk_score(volatility):
    """
    Calculate a numeric risk score from 0-100
    Lower = safer, Higher = riskier
    Uses absolute volatility mapped to a 0-100 scale
    """
    abs_vol = abs(volatility)
    # Map volatility to 0-100 score
    # 0% change = 0 score, 15%+ change = 100 score
    score = min(abs_vol / 15 * 100, 100)
    return round(score, 1)

def calculate_portfolio_risk(holdings_data):
    """
    Calculate the overall portfolio risk using weighted volatility
    This is the main "AI/ML" algorithm
    
    holdings_data: list of dicts with 'current_value', 'change_24h' fields
    
    The formula:
    1. Calculate each coin's weight (what % of portfolio it is)
    2. Multiply weight by that coin's volatility
    3. Add them all up = weighted portfolio volatility
    4. Convert to risk score
    """
    if not holdings_data:
        return 0, "N/A", "gray"
    
    total_value = sum(h['current_value'] for h in holdings_data)
    if total_value == 0:
        return 0, "N/A", "gray"
    
    # Calculate weighted volatility
    weighted_volatility = 0
    for holding in holdings_data:
        weight = holding['current_value'] / total_value
        coin_volatility = abs(holding.get('change_24h', 0))
        weighted_volatility += weight * coin_volatility
    
    # Convert to risk score (0-100)
    risk_score = min(weighted_volatility / 15 * 100, 100)
    risk_score = round(risk_score, 1)
    
    # Determine risk level
    if risk_score < 30:
        risk_label = "🟢 Low Risk"
        risk_color = "green"
    elif risk_score < 60:
        risk_label = "🟡 Medium Risk"
        risk_color = "orange"
    else:
        risk_label = "🔴 High Risk"
        risk_color = "red"
    
    return risk_score, risk_label, risk_color

def calculate_var(holdings_data, confidence=0.95):
    """
    Calculate Value at Risk (VaR)
    VaR tells you: "In the worst case (95% confidence), 
    how much could you lose in one day?"
    
    Simple VaR formula:
    VaR = Portfolio Value × Z-score × Weighted Volatility / 100
    
    Z-score for 95% confidence = 1.645
    Z-score for 99% confidence = 2.326
    """
    if not holdings_data:
        return 0
    
    total_value = sum(h['current_value'] for h in holdings_data)
    if total_value == 0:
        return 0
    
    # Get z-score based on confidence level
    if confidence >= 0.99:
        z_score = 2.326
    else:
        z_score = 1.645  # 95% confidence
    
    # Calculate weighted daily volatility
    weighted_vol = 0
    for holding in holdings_data:
        weight = holding['current_value'] / total_value
        daily_vol = abs(holding.get('change_24h', 0)) / 100  # convert % to decimal
        weighted_vol += weight * daily_vol
    
    # VaR calculation
    var_amount = total_value * z_score * weighted_vol
    
    return round(var_amount, 2)

def get_diversification_score(holdings_data):
    """
    Calculate how diversified the portfolio is
    Uses a simple concentration metric
    
    If one coin is 100% of portfolio = poorly diversified (score 0)
    If coins are evenly spread = well diversified (score 100)
    
    Uses Herfindahl-Hirschman Index (HHI) concept
    """
    if not holdings_data or len(holdings_data) == 0:
        return 0, "No holdings"
    
    if len(holdings_data) == 1:
        return 10, "Very Low - Only 1 asset"
    
    total_value = sum(h['current_value'] for h in holdings_data)
    if total_value == 0:
        return 0, "No value"
    
    # Calculate HHI (sum of squared weights)
    hhi = 0
    for holding in holdings_data:
        weight = holding['current_value'] / total_value
        hhi += weight ** 2
    
    # Convert HHI to a 0-100 diversification score
    # HHI = 1 means all in one coin (bad), HHI = 1/n means perfectly spread (good)
    n = len(holdings_data)
    min_hhi = 1 / n  # best possible
    max_hhi = 1  # worst possible (all in one)
    
    if max_hhi == min_hhi:
        div_score = 100
    else:
        div_score = (1 - (hhi - min_hhi) / (max_hhi - min_hhi)) * 100
    
    div_score = round(div_score, 1)
    
    # Recommendation based on score
    if div_score >= 70:
        recommendation = "Good diversification"
    elif div_score >= 40:
        recommendation = "Moderate - consider adding more assets"
    else:
        recommendation = "Low - portfolio is too concentrated"
    
    return div_score, recommendation

def get_recommendations(holdings_data, portfolio_risk_score, div_score):
    """
    Generate simple recommendations based on portfolio analysis
    Returns a list of recommendation strings
    """
    recommendations = []
    
    if not holdings_data:
        recommendations.append("Start by adding some cryptocurrencies to your portfolio")
        return recommendations
    
    # Risk-based recommendations
    if portfolio_risk_score > 70:
        recommendations.append("⚠️ Your portfolio has high risk. Consider adding stablecoins or lower-volatility assets.")
    elif portfolio_risk_score > 40:
        recommendations.append("📊 Moderate risk level. Your portfolio has a balanced risk profile.")
    else:
        recommendations.append("✅ Low risk level. Your portfolio is relatively stable.")
    
    # Diversification recommendations
    if len(holdings_data) < 3:
        recommendations.append("📈 Consider adding more assets (at least 3-5) for better diversification.")
    
    if div_score < 40:
        # Find the dominant coin
        total_value = sum(h['current_value'] for h in holdings_data)
        for h in holdings_data:
            pct = (h['current_value'] / total_value * 100) if total_value > 0 else 0
            if pct > 60:
                recommendations.append(f"⚖️ {h['name']} makes up {pct:.0f}% of your portfolio. Consider rebalancing.")
    
    # Performance recommendations
    losing_coins = [h for h in holdings_data if h.get('profit_loss', 0) < 0]
    if len(losing_coins) > len(holdings_data) / 2:
        recommendations.append("📉 Most of your assets are currently at a loss. Consider reviewing your strategy.")
    
    return recommendations