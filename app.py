import streamlit as st
import pandas as pd
import sqlite3
import plotly.graph_objects as go
from datetime import datetime
import time

# Configuração da Página (Estilo TWS Dark)
st.set_page_config(page_title="Robô de Trading - Dashboard", layout="wide")

# Estilo CSS para parecer com o TWS
st.markdown("""
    <style>
    .main {
        background-color: #1a1a1a;
        color: #ffffff;
    }
    .stMetric {
        background-color: #262626;
        padding: 10px;
        border-radius: 5px;
    }
    </style>
    """, unsafe_allow_html=True)

DB_PATH = "trading_history.db"

def load_signals():
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query("SELECT * FROM signals ORDER BY timestamp DESC", conn)
        conn.close()
        return df
    except Exception as e:
        return pd.DataFrame()

def load_market_data():
    # Por enquanto, pegamos dados reais do yfinance para o gráfico, 
    # pois o banco pode estar vazio no início
    import yfinance as yf
    from config.settings import DEFAULT_SYMBOL
    data = yf.download(DEFAULT_SYMBOL, period="1d", interval="5m")
    return data

st.title("📊 Trading Bot Dashboard (TWS Mirror)")

# Sidebar para Status
st.sidebar.header("Status do Robô")
st.sidebar.success("Conectado ao Banco de Dados")
st.sidebar.info("Modo: TWS Paper Trading")

# Layout de Colunas (Informações de Topo)
col1, col2, col3, col4 = st.columns(4)

signals_df = load_signals()

if not signals_df.empty:
    last_signal = signals_df.iloc[0]
    col1.metric("Símbolo Ativo", last_signal['symbol'])
    col2.metric("Último Preço", f"${last_signal['price']:.2f}")
    
    signal_color = "normal"
    if last_signal['signal'] == "BUY":
        signal_color = "inverse" # Verde/Vermelho dependendo do tema
    
    col3.metric("Último Sinal", last_signal['signal'], delta_color=signal_color)
    col4.metric("Risco Calculado", f"${last_signal['risk_value']:.2f}")

# Gráfico Principal
st.subheader("📈 Gráfico Intradiário (Real-Time)")
market_df = load_market_data()

if not market_df.empty:
    fig = go.Figure(data=[go.Candlestick(x=market_df.index,
                open=market_df['Open'],
                high=market_df['High'],
                low=market_df['Low'],
                close=market_df['Close'],
                name="Market Data")])
    
    fig.update_layout(template="plotly_dark", xaxis_rangeslider_visible=False)
    st.plotly_chart(fig, use_container_width=True)

# Tabela de Histórico
st.subheader("📜 Histórico de Sinais")
if not signals_df.empty:
    st.dataframe(signals_df, use_container_width=True)
else:
    st.write("Nenhum sinal registrado ainda.")

# Botão para Executar Robô manualmente
if st.button("Executar Robô Agora"):
    with st.spinner("Processando estratégia..."):
        import subprocess
        subprocess.run(["python", "main.py"])
        st.rerun()

st.caption(f"Última atualização: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# Auto-refresh a cada 60 segundos
time.sleep(60)
st.rerun()
