# analytics.py
# Handles all the charts and visualizations
# Uses Plotly for interactive charts

import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime

def create_allocation_pie_chart(holdings_data):
    """
    Create a pie chart showing asset allocation
    holdings_data: list with 'name' and 'current_value' fields
    """
    if not holdings_data:
        return None
    
    names = [h['name'] for h in holdings_data]
    values = [h['current_value'] for h in holdings_data]
    
    fig = go.Figure(data=[go.Pie(
        labels=names,
        values=values,
        hole=0.4,  # donut chart looks nicer
        textinfo='label+percent',
        textposition='outside',
        marker=dict(
            colors=px.colors.qualitative.Set3[:len(names)]
        )
    )])
    
    fig.update_layout(
        title="Asset Allocation",
        showlegend=True,
        height=400,
        margin=dict(t=50, b=50, l=50, r=50)
    )
    
    return fig

def create_performance_bar_chart(holdings_data):
    """
    Create a bar chart showing profit/loss for each asset
    Green bars = profit, Red bars = loss
    """
    if not holdings_data:
        return None
    
    names = [h['name'] for h in holdings_data]
    pl_values = [h.get('profit_loss', 0) for h in holdings_data]
    colors = ['green' if v >= 0 else 'red' for v in pl_values]
    
    fig = go.Figure(data=[go.Bar(
        x=names,
        y=pl_values,
        marker_color=colors,
        text=[f"${v:,.2f}" for v in pl_values],
        textposition='outside'
    )])
    
    fig.update_layout(
        title="Profit/Loss by Asset",
        xaxis_title="Cryptocurrency",
        yaxis_title="Profit/Loss (USD)",
        height=400,
        showlegend=False
    )
    
    return fig

def create_price_history_chart(price_data, coin_name):
    """
    Create a line chart showing price history
    price_data: list of [timestamp, price] from API
    """
    if not price_data:
        return None
    
    dates = [datetime.fromtimestamp(p[0] / 1000) for p in price_data]
    prices = [p[1] for p in price_data]
    
    fig = go.Figure(data=[go.Scatter(
        x=dates,
        y=prices,
        mode='lines',
        name=coin_name,
        line=dict(color='#1f77b4', width=2),
        fill='tozeroy',
        fillcolor='rgba(31, 119, 180, 0.1)'
    )])
    
    fig.update_layout(
        title=f"{coin_name} Price History (30 Days)",
        xaxis_title="Date",
        yaxis_title="Price (USD)",
        height=400,
        hovermode='x unified'
    )
    
    return fig

def create_risk_gauge(risk_score):
    """
    Create a gauge chart showing portfolio risk score
    Like a speedometer - green on left, red on right
    """
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=risk_score,
        title={'text': "Portfolio Risk Score"},
        gauge={
            'axis': {'range': [0, 100]},
            'bar': {'color': "darkblue"},
            'steps': [
                {'range': [0, 30], 'color': "lightgreen"},
                {'range': [30, 60], 'color': "yellow"},
                {'range': [60, 100], 'color': "salmon"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': risk_score
            }
        }
    ))
    
    fig.update_layout(height=300)
    
    return fig

def create_comparison_chart(portfolio_change, btc_change):
    """
    Create a bar chart comparing portfolio vs Bitcoin performance
    """
    fig = go.Figure(data=[
        go.Bar(
            x=['Your Portfolio', 'Bitcoin'],
            y=[portfolio_change, btc_change],
            marker_color=['#636EFA', '#FFA500'],
            text=[f"{portfolio_change:.2f}%", f"{btc_change:.2f}%"],
            textposition='outside'
        )
    ])
    
    fig.update_layout(
        title="Your Portfolio vs Bitcoin (24h Change)",
        yaxis_title="24h Change (%)",
        height=350,
        showlegend=False
    )
    
    return fig

def create_holdings_value_chart(holdings_data):
    """
    Horizontal bar chart showing value of each holding
    """
    if not holdings_data:
        return None
    
    # Sort by value
    sorted_holdings = sorted(holdings_data, key=lambda x: x['current_value'], reverse=True)
    names = [h['name'] for h in sorted_holdings]
    values = [h['current_value'] for h in sorted_holdings]
    
    fig = go.Figure(data=[go.Bar(
        y=names,
        x=values,
        orientation='h',
        marker_color=px.colors.qualitative.Set2[:len(names)],
        text=[f"${v:,.2f}" for v in values],
        textposition='outside'
    )])
    
    fig.update_layout(
        title="Holdings by Value",
        xaxis_title="Value (USD)",
        height=max(300, len(names) * 50),
        showlegend=False
    )
    
    return fig