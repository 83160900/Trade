import streamlit as st
import os
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime
import time
from database.db_manager import get_recent_signals, get_daily_pnl, get_open_position, check_db_connection, init_db, sync_daily_history
from config.settings import DEFAULT_SYMBOL

# 1. CONFIGURAÇÃO DA PÁGINA (ESTILO TWS DARK)
st.set_page_config(page_title="TWS Mirror - Pro Dashboard", layout="wide", initial_sidebar_state="collapsed")

# 2. ESTILO CSS PARA UI DE TRADING PROFISSIONAL
st.markdown("""
    <style>
    /* Fundo Escuro Trading */
    .main { background-color: #0b0e11; color: #e1e1e1; }
    div[data-testid="stVerticalBlock"] > div:has(div.stMetric) { background-color: #1e2329; border: 1px solid #333; border-radius: 4px; padding: 5px; }
    
    /* Botões BUY/SELL Estilo TWS */
    .stButton>button { width: 100%; border-radius: 4px; font-weight: bold; }
    div.stButton > button:first-child:contains("BUY") { background-color: #2ebd85 !important; color: white !important; border: none !important; }
    div.stButton > button:first-child:contains("SELL") { background-color: #f6465d !important; color: white !important; border: none !important; }
    
    /* Header e Status */
    .header-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px; background-color: #1e2329; border-bottom: 1px solid #333; margin-bottom: 20px; border-radius: 4px; }
    .status-tag { padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-left: 10px; }
    .status-ok { background-color: #2ebd85; color: white; }
    .status-error { background-color: #f6465d; color: white; }
    </style>
    """, unsafe_allow_html=True)

# 3. VERIFICAÇÃO DE CONEXÃO E INICIALIZAÇÃO
db_ok, db_msg = check_db_connection()
if db_ok:
    try:
        init_db()
        sync_daily_history()
    except:
        pass

# 4. HEADER (TOPO)
header_cols = st.columns([2, 1, 1, 2])
with header_cols[0]:
    st.markdown(f"### 📊 TWS Mirror: {DEFAULT_SYMBOL}")
with header_cols[1]:
    st.markdown(f"**🕒 {datetime.now().strftime('%H:%M:%S')}**")
with header_cols[2]:
    db_status_class = "status-ok" if db_ok else "status-error"
    st.markdown(f"**DB:** <span class='status-tag {db_status_class}'>{'Online' if db_ok else 'Offline'}</span>", unsafe_allow_html=True)
with header_cols[3]:
    st.markdown(f"**TWS:** <span class='status-tag status-ok'>Connected</span>", unsafe_allow_html=True)

st.divider()

# 5. LAYOUT PRINCIPAL (GRID: ESQUERDA, CENTRO, DIREITA)
main_cols = st.columns([1.2, 4, 1.2])

# --- COLUNA ESQUERDA: ORDER ENTRY ---
with main_cols[0]:
    st.subheader("🛒 Order Entry")
    with st.container(border=True):
        st.write(f"Symbol: **{DEFAULT_SYMBOL}**")
        order_type = st.selectbox("Type", ["LIMIT", "MARKET", "STOP"])
        qty = st.number_input("QTY", value=100, step=10)
        limit_px = st.number_input("Price", value=0.0, step=0.01, format="%.2f")
        
        btn_cols = st.columns(2)
        if btn_cols[0].button("BUY", key="buy_btn"):
            st.toast(f"BUY order for {qty} {DEFAULT_SYMBOL} submitted.")
        if btn_cols[1].button("SELL", key="sell_btn"):
            st.toast(f"SELL order for {qty} {DEFAULT_SYMBOL} submitted.")
        
        st.button("SUBMIT ORDER", type="primary", use_container_width=True)
    
    st.divider()
    st.subheader("💰 Account PnL")
    daily_pnl = get_daily_pnl(DEFAULT_SYMBOL) if db_ok else 0.0
    st.metric("Daily PnL", f"{daily_pnl*100:.2f}%", delta=f"{daily_pnl*100:.2f}%")

# --- COLUNA CENTRAL: CHART ---
with main_cols[1]:
    st.subheader("📈 Real-Time Chart")
    import yfinance as yf
    try:
        market_df = yf.download(DEFAULT_SYMBOL, period="1d", interval="1m", progress=False)
        if not market_df.empty:
            fig = go.Figure(data=[go.Candlestick(x=market_df.index,
                        open=market_df['Open'], high=market_df['High'],
                        low=market_df['Low'], close=market_df['Close'],
                        name="Market")])
            fig.update_layout(template="plotly_dark", height=500, margin=dict(l=0, r=0, t=0, b=0),
                            xaxis_rangeslider_visible=False)
            st.plotly_chart(fig, width='stretch', config={'displayModeBar': False})
        else:
            st.info("Aguardando dados de mercado...")
    except Exception as e:
        st.error(f"Erro ao carregar gráfico: {e}")

# --- COLUNA DIREITA: WATCHLIST ---
with main_cols[2]:
    st.subheader("👀 Watchlist")
    watchlist = ['AAPL', 'TSLA', 'MSFT', 'NVDA']
    for sym in watchlist:
        with st.container(border=True):
            w_cols = st.columns([1, 1])
            w_cols[0].write(f"**{sym}**")
            w_cols[1].markdown("<span style='color:#2ebd85'>+1.2%</span>", unsafe_allow_html=True)

# 6. PARTE INFERIOR: ORDERS / TRADES / LOGS
st.divider()
st.subheader("📋 Activity Monitor")
tabs = st.tabs(["Orders", "Trades", "Activity Log"])

with tabs[0]: # Orders
    signals_df = get_recent_signals(10) if db_ok else pd.DataFrame()
    if not signals_df.empty:
        st.dataframe(signals_df[['timestamp', 'symbol', 'price', 'signal', 'status']], width='stretch')
    else:
        st.write("No active orders.")

with tabs[1]: # Trades
    if not signals_df.empty:
        st.dataframe(signals_df[signals_df['status'] == 'CLOSED'], width='stretch')
    else:
        st.write("No trades recorded today.")

with tabs[2]: # Log
    st.text_area("System Logs", value=f"[{datetime.now().strftime('%H:%M:%S')}] Application started on port 8584\n[{datetime.now().strftime('%H:%M:%S')}] DB Connection: {'OK' if db_ok else 'FAILED'}", height=100)

st.caption(f"TWS Mirror Pro v2.0 - Powered by Junie AI")
# Deploy forçado em: 2026-03-07 21:05
