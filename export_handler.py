# export_handler.py
# Handles exporting data to CSV files
# Users can download their portfolio and transaction history

import csv
import io
from datetime import datetime

def export_portfolio_csv(holdings_data):
    """
    Export current portfolio holdings to CSV format
    Returns a string buffer that Streamlit can use for download
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header row
    writer.writerow([
        'Coin', 'Amount', 'Current Price (USD)', 'Current Value (USD)',
        'Cost Basis (USD)', 'Avg Cost Per Coin', 'Profit/Loss (USD)',
        'Profit/Loss (%)', '24h Change (%)'
    ])
    
    # Write data rows
    total_value = 0
    total_cost = 0
    total_pl = 0
    
    for h in holdings_data:
        writer.writerow([
            h['name'],
            f"{h['amount']:.4f}",
            f"{h['current_price']:.2f}",
            f"{h['current_value']:.2f}",
            f"{h.get('cost_basis', 0):.2f}",
            f"{h.get('avg_cost', 0):.2f}",
            f"{h.get('profit_loss', 0):.2f}",
            f"{h.get('profit_loss_pct', 0):.2f}",
            f"{h.get('change_24h', 0):.2f}"
        ])
        total_value += h['current_value']
        total_cost += h.get('cost_basis', 0)
        total_pl += h.get('profit_loss', 0)
    
    # Add totals row
    writer.writerow([])
    writer.writerow([
        'TOTAL', '', '', f"{total_value:.2f}",
        f"{total_cost:.2f}", '', f"{total_pl:.2f}",
        f"{(total_pl/total_cost*100) if total_cost > 0 else 0:.2f}", ''
    ])
    
    return output.getvalue()

def export_transactions_csv(transactions):
    """
    Export transaction history to CSV format
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'ID', 'Date', 'Type', 'Coin', 'Amount',
        'Price Per Coin (USD)', 'Total (USD)'
    ])
    
    # Data rows
    for txn in transactions:
        writer.writerow([
            txn['id'],
            txn['date'],
            txn['type'].upper(),
            txn['coin_name'],
            f"{txn['amount']:.4f}",
            f"{txn['price_per_coin']:.2f}",
            f"{txn['total_cost']:.2f}"
        ])
    
    return output.getvalue()

def generate_report_text(holdings_data, risk_score, risk_label, var_amount, div_score):
    """
    Generate a simple text report summary
    """
    report = []
    report.append("=" * 50)
    report.append("CRYPTO PORTFOLIO REPORT")
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("=" * 50)
    report.append("")
    
    total_value = sum(h['current_value'] for h in holdings_data)
    total_cost = sum(h.get('cost_basis', 0) for h in holdings_data)
    total_pl = total_value - total_cost
    
    report.append(f"Total Portfolio Value: ${total_value:,.2f}")
    report.append(f"Total Cost Basis: ${total_cost:,.2f}")
    report.append(f"Total Profit/Loss: ${total_pl:,.2f}")
    report.append("")
    report.append(f"Risk Score: {risk_score}/100 ({risk_label})")
    report.append(f"Value at Risk (95%): ${var_amount:,.2f}")
    report.append(f"Diversification Score: {div_score}/100")
    report.append("")
    report.append("HOLDINGS:")
    report.append("-" * 50)
    
    for h in holdings_data:
        report.append(f"  {h['name']}: {h['amount']:.4f} coins")
        report.append(f"    Value: ${h['current_value']:,.2f} | P/L: ${h.get('profit_loss', 0):,.2f}")
    
    return "\n".join(report)