# ui_theme.py
# CSS theme matching the Figma design
# Dark theme with cyan accent, neutral-900 cards, rounded corners

import streamlit as st

# Chart colors from the Figma design
CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899']

# Plotly dark theme matching Figma
PLOTLY_DARK = dict(
    paper_bgcolor='rgba(0,0,0,0)',
    plot_bgcolor='rgba(0,0,0,0)',
    font_color='#a3a3a3',
    title_font_color='#ffffff',
    xaxis=dict(gridcolor='#262626', zerolinecolor='#262626'),
    yaxis=dict(gridcolor='#262626', zerolinecolor='#262626'),
    margin=dict(t=50, b=40, l=50, r=20),
)

def apply_theme():
    """Apply the Figma dark theme"""
    st.markdown("""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        /* ===== GLOBAL ===== */
        .stApp {
            background-color: #0a0a0a;
            color: #fafafa;
            font-family: 'Inter', sans-serif;
        }
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        
        /* ===== SIDEBAR ===== */
        section[data-testid="stSidebar"] {
            background-color: #171717;
            border-right: 1px solid #262626;
        }
        section[data-testid="stSidebar"] .stMarkdown { color: #a3a3a3; }
        
        /* ===== GRADIENT HERO CARD (cyan-blue) ===== */
        .hero-card {
            background: linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.1) 100%);
            border: 1px solid rgba(6,182,212,0.2);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 20px;
        }
        .hero-card .label {
            color: #a3a3a3;
            font-size: 0.85rem;
            margin-bottom: 8px;
        }
        .hero-card .big-value {
            color: #ffffff;
            font-size: 2.4rem;
            font-weight: 700;
            letter-spacing: -1px;
            margin-bottom: 10px;
            line-height: 1.1;
        }
        .hero-card .delta-up {
            color: #4ade80;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .hero-card .delta-down {
            color: #f87171;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        /* ===== RISK CARD (colored by level) ===== */
        .risk-card-low {
            background: rgba(74,222,128,0.1);
            border: 1px solid rgba(74,222,128,0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .risk-card-med {
            background: rgba(250,204,21,0.1);
            border: 1px solid rgba(250,204,21,0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .risk-card-high {
            background: rgba(248,113,113,0.1);
            border: 1px solid rgba(248,113,113,0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .risk-label { color: #a3a3a3; font-size: 0.85rem; margin-bottom: 4px; }
        .risk-value-low { color: #4ade80; font-size: 1.6rem; font-weight: 600; }
        .risk-value-med { color: #facc15; font-size: 1.6rem; font-weight: 600; }
        .risk-value-high { color: #f87171; font-size: 1.6rem; font-weight: 600; }
        .risk-desc { color: #a3a3a3; font-size: 0.8rem; margin-top: 12px; }
        
        /* ===== DARK CARDS (neutral-900) ===== */
        .dark-card {
            background: #171717;
            border: 1px solid #262626;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .dark-card-compact {
            background: #171717;
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 16px;
        }
        .card-title {
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 500;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .card-title .icon { color: #22d3ee; }
        
        /* ===== STAT BOXES ===== */
        .stat-box {
            background: #171717;
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 16px;
        }
        .stat-label {
            color: #a3a3a3;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .stat-value {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: 600;
        }
        .stat-sub { font-size: 0.8rem; margin-top: 2px; }
        .stat-sub-green { color: #4ade80; font-size: 0.8rem; }
        .stat-sub-red { color: #f87171; font-size: 0.8rem; }
        
        /* ===== ASSET ROW ===== */
        .asset-row {
            background: #171717;
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            transition: border-color 0.15s;
        }
        .asset-row:hover { border-color: #404040; }
        .asset-row .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .asset-row .left {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .asset-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            font-weight: 600;
        }
        .asset-name { color: #ffffff; font-weight: 500; font-size: 0.95rem; }
        .asset-symbol { color: #a3a3a3; font-size: 0.8rem; }
        .asset-value { color: #ffffff; font-weight: 500; text-align: right; }
        .asset-change-up { color: #4ade80; font-size: 0.85rem; text-align: right; display:flex; align-items:center; justify-content:flex-end; gap:4px; }
        .asset-change-down { color: #f87171; font-size: 0.85rem; text-align: right; display:flex; align-items:center; justify-content:flex-end; gap:4px; }
        .asset-row .bottom {
            display: flex;
            justify-content: space-between;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #262626;
            font-size: 0.85rem;
            color: #a3a3a3;
        }
        
        /* ===== INSIGHT ROW ===== */
        .insight-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #0a0a0a;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 8px;
        }
        .insight-label { color: #a3a3a3; font-size: 0.85rem; }
        .insight-value { font-weight: 500; font-size: 0.9rem; }
        .insight-cyan { color: #22d3ee; }
        .insight-green { color: #4ade80; }
        .insight-red { color: #f87171; }
        
        /* ===== STEP LIST (How Risk is Calculated) ===== */
        .step-item {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
        }
        .step-num {
            width: 24px; height: 24px;
            border-radius: 50%;
            background: rgba(6,182,212,0.2);
            color: #22d3ee;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .step-title { color: #ffffff; font-weight: 500; font-size: 0.9rem; margin-bottom: 2px; }
        .step-desc { color: #a3a3a3; font-size: 0.8rem; }
        
        /* ===== MARKET TABLE ===== */
        .market-row {
            display: flex;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid #262626;
        }
        .market-row:last-child { border-bottom: none; }
        .market-rank { color: #525252; font-size: 0.8rem; width: 30px; }
        .market-info { flex: 1; }
        .market-name { color: #fff; font-weight: 500; font-size: 0.9rem; }
        .market-sym { color: #a3a3a3; font-size: 0.75rem; }
        .market-price { color: #fafafa; font-weight: 500; width: 110px; text-align: right; }
        .market-change-up { color: #4ade80; font-weight: 500; width: 80px; text-align: right; }
        .market-change-down { color: #f87171; font-weight: 500; width: 80px; text-align: right; }
        .market-mcap { color: #a3a3a3; font-size: 0.85rem; width: 120px; text-align: right; }
        
        /* ===== TABS ===== */
        .stTabs [data-baseweb="tab-list"] {
            gap: 0; background: #171717;
            border-radius: 12px; padding: 4px; border: 1px solid #262626;
        }
        .stTabs [data-baseweb="tab"] {
            color: #a3a3a3; border-radius: 8px; padding: 10px 18px; font-weight: 500;
        }
        .stTabs [aria-selected="true"] { background: rgba(6,182,212,0.15); color: #22d3ee; }
        
        /* ===== BUTTONS ===== */
        .stButton > button {
            background: #06b6d4;
            color: #ffffff;
            border: none;
            border-radius: 12px;
            font-weight: 500;
            padding: 10px 20px;
            transition: all 0.2s;
        }
        .stButton > button:hover {
            background: #0891b2;
            box-shadow: 0 4px 12px rgba(6,182,212,0.3);
        }
        
        /* ===== LOGIN ===== */
        .login-title {
            text-align: center; color: #fff;
            font-size: 1.8rem; font-weight: 600; margin-bottom: 4px;
        }
        .login-sub {
            text-align: center; color: #a3a3a3;
            font-size: 0.9rem; margin-bottom: 28px;
        }
        .login-box {
            background: #171717; border: 1px solid #262626;
            border-radius: 16px; padding: 28px; margin-top: 16px;
        }
        
        /* ===== PASSWORD STRENGTH ===== */
        .pw-weak { color: #f87171; font-size: 0.8rem; margin-top: 4px; }
        .pw-ok { color: #facc15; font-size: 0.8rem; margin-top: 4px; }
        .pw-strong { color: #4ade80; font-size: 0.8rem; margin-top: 4px; }
        
        /* ===== FORM OVERRIDES ===== */
        .stTextInput input, .stNumberInput input, .stSelectbox select {
            background: #171717 !important;
            border: 1px solid #262626 !important;
            border-radius: 12px !important;
            color: #fafafa !important;
        }
        .stTextInput input:focus, .stNumberInput input:focus {
            border-color: #06b6d4 !important;
            box-shadow: 0 0 0 2px rgba(6,182,212,0.3) !important;
        }
        
        /* ===== PLOTLY + DATAFRAME ===== */
        .stPlotlyChart {
            background: #171717;
            border: 1px solid #262626;
            border-radius: 16px;
            padding: 8px;
        }
        
        /* ===== PROFILE CARD ===== */
        .profile-card {
            background: linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.1) 100%);
            border: 1px solid rgba(6,182,212,0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .profile-avatar {
            width: 64px; height: 64px;
            border-radius: 50%;
            background: rgba(6,182,212,0.2);
            color: #22d3ee;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        /* ===== SETTINGS ROW ===== */
        .settings-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid #262626;
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-icon {
            width: 40px; height: 40px;
            border-radius: 50%;
            background: #262626;
            color: #22d3ee;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* ===== TRANSACTION ROW ===== */
        .txn-row {
            background: #171717;
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .txn-buy { color: #4ade80; font-weight: 600; }
        .txn-sell { color: #f87171; font-weight: 600; }
        
        /* ===== LOGOUT BUTTON ===== */
        .logout-btn {
            background: rgba(248,113,113,0.1);
            border: 1px solid rgba(248,113,113,0.2);
            color: #f87171;
            border-radius: 12px;
            padding: 14px;
            font-weight: 500;
            width: 100%;
            text-align: center;
            cursor: pointer;
            transition: background 0.2s;
        }
        .logout-btn:hover { background: rgba(248,113,113,0.2); }
    </style>
    """, unsafe_allow_html=True)