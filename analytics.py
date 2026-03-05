# analytics.py
# Chart generation using Plotly
# Colors match the Figma design: cyan, purple, amber, emerald, red, pink

import plotly.graph_objects as go

# Figma color palette
COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899',
          '#3b82f6', '#14b8a6', '#f97316', '#a855f7']


def create_allocation_pie_chart(holdings_data):
    """Donut chart showing asset allocation"""
    if not holdings_data:
        return None
    
    names = [h['name'] for h in holdings_data]
    values = [h['current_value'] for h in holdings_data]
    
    fig = go.Figure(data=[go.Pie(
        labels=names,
        values=values,
        hole=0.5,
        marker=dict(colors=COLORS[:len(names)]),
        textinfo='label+percent',
        textfont_size=12,
        textfont_color='#a3a3a3',
        hovertemplate='%{label}<br>$%{value:,.2f}<br>%{percent}<extra></extra>'
    )])
    
    fig.update_layout(
        title="Asset Allocation",
        showlegend=False,
        height=300,
    )
    return fig


def create_performance_bar_chart(holdings_data):
    """Bar chart showing P/L per asset"""
    if not holdings_data:
        return None
    
    names = [h['name'] for h in holdings_data]
    pls = [h.get('profit_loss', 0) for h in holdings_data]
    colors = ['#4ade80' if p >= 0 else '#f87171' for p in pls]
    
    fig = go.Figure(data=[go.Bar(
        x=names,
        y=pls,
        marker_color=colors,
        marker_cornerradius=8,
        hovertemplate='%{x}<br>$%{y:,.2f}<extra></extra>'
    )])
    
    fig.update_layout(
        title="Profit / Loss by Asset",
        xaxis_title="",
        yaxis_title="USD",
        height=300,
    )
    return fig


def create_price_history_chart(price_data, coin_name):
    """Line chart with fill for price history"""
    if not price_data:
        return None
    
    dates = [p[0] for p in price_data]
    prices = [p[1] for p in price_data]
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=dates,
        y=prices,
        mode='lines',
        line=dict(color='#06b6d4', width=2),
        fill='tozeroy',
        fillcolor='rgba(6,182,212,0.08)',
        hovertemplate='%{x}<br>$%{y:,.2f}<extra></extra>',
        name=coin_name
    ))
    
    fig.update_layout(
        title=f"{coin_name} Price History",
        xaxis_title="",
        yaxis_title="USD",
        height=280,
        showlegend=False,
    )
    return fig


def create_risk_gauge(risk_score):
    """Gauge chart for risk score"""
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=risk_score,
        title={'text': "Portfolio Risk Score", 'font': {'size': 16, 'color': '#ffffff'}},
        number={'font': {'size': 40, 'color': '#ffffff'}},
        gauge={
            'axis': {'range': [0, 100], 'tickcolor': '#a3a3a3'},
            'bar': {'color': '#06b6d4'},
            'steps': [
                {'range': [0, 30], 'color': 'rgba(74,222,128,0.2)'},
                {'range': [30, 60], 'color': 'rgba(250,204,21,0.2)'},
                {'range': [60, 100], 'color': 'rgba(248,113,113,0.2)'}
            ],
            'threshold': {
                'line': {'color': '#22d3ee', 'width': 3},
                'thickness': 0.8,
                'value': risk_score
            }
        }
    ))
    
    fig.update_layout(height=250)
    return fig


def create_comparison_chart(portfolio_change, btc_change):
    """Bar chart comparing portfolio vs Bitcoin performance"""
    fig = go.Figure(data=[go.Bar(
        x=['Your Portfolio', 'Bitcoin'],
        y=[portfolio_change, btc_change],
        marker_color=['#06b6d4', '#f59e0b'],
        marker_cornerradius=8,
        text=[f"{portfolio_change:+.2f}%", f"{btc_change:+.2f}%"],
        textposition='outside',
        textfont=dict(color='#a3a3a3'),
        hovertemplate='%{x}: %{y:.2f}%<extra></extra>'
    )])
    
    fig.update_layout(
        title="Your Portfolio vs Bitcoin (24h)",
        yaxis_title="Change %",
        height=280,
        showlegend=False,
    )
    return fig


def create_holdings_value_chart(holdings_data):
    """Horizontal bar chart of holdings by value"""
    if not holdings_data:
        return None
    
    sorted_h = sorted(holdings_data, key=lambda x: x['current_value'])
    names = [h['name'] for h in sorted_h]
    values = [h['current_value'] for h in sorted_h]
    
    fig = go.Figure(data=[go.Bar(
        y=names,
        x=values,
        orientation='h',
        marker_color=COLORS[:len(names)],
        marker_cornerradius=8,
        hovertemplate='%{y}<br>$%{x:,.2f}<extra></extra>'
    )])
    
    fig.update_layout(
        title="Holdings by Value",
        xaxis_title="USD",
        height=max(200, len(names) * 50),
        showlegend=False,
    )
    return fig


def create_volatility_chart(holdings_data):
    """Bar chart showing volatility by asset (Figma analytics page)"""
    if not holdings_data:
        return None
    
    names = [h['name'] for h in holdings_data]
    vols = [abs(h.get('change_24h', 0)) for h in holdings_data]
    
    fig = go.Figure(data=[go.Bar(
        x=names,
        y=vols,
        marker_color='#06b6d4',
        marker_cornerradius=8,
        hovertemplate='%{x}<br>Volatility: %{y:.2f}%<extra></extra>'
    )])
    
    fig.update_layout(
        title="Volatility by Asset",
        yaxis_title="Volatility %",
        height=260,
        showlegend=False,
    )
    return fig


def create_portfolio_vs_btc_line(portfolio_change, btc_change):
    """Line chart comparing portfolio vs bitcoin over time (simplified)"""
    # Create 6-month simulated data like the Figma
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    
    # Portfolio trending based on current performance
    base = 100
    port_data = [base - 15, base - 12, base - 8, base - 5, base, base + portfolio_change]
    btc_data = [base - 10, base - 15, base - 12, base - 8, base - 5, base + btc_change]
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=months, y=port_data,
        mode='lines+markers',
        line=dict(color='#06b6d4', width=2),
        marker=dict(color='#06b6d4', size=6),
        name='Your Portfolio'
    ))
    fig.add_trace(go.Scatter(
        x=months, y=btc_data,
        mode='lines+markers',
        line=dict(color='#f59e0b', width=2),
        marker=dict(color='#f59e0b', size=6),
        name='Bitcoin'
    ))
    
    fig.update_layout(
        title="Your Portfolio vs Bitcoin",
        height=250,
        legend=dict(font=dict(size=11, color='#a3a3a3')),
    )
    return fig