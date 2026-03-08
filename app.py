import streamlit as st
import os

# LOG DE INICIALIZAÇÃO PARA O RAILWAY
print("--- INICIANDO PAINEL WEB NO RAILWAY ---")
print(f"PORTA FORÇADA: 8584")

import pandas as pd
import plotly.graph_objects as go
from datetime import datetime
import time
from database.db_manager import get_recent_signals, get_daily_pnl, get_open_position
from config.settings import DEFAULT_SYMBOL

# Configuração da Página (Estilo TWS Dark)
st.set_page_config(page_title="TWS Mirror - Robô Trading", layout="wide")

# Estilo CSS para o Tema TWS Dark
st.markdown("""
    <style>
    .main { background-color: #0b0e11; color: #ffffff; }
    .stMetric { background-color: #1e2329; padding: 15px; border-radius: 8px; border: 1px solid #333; }
    [data-testid="stSidebar"] { background-color: #1e2329; }
    </style>
    """, unsafe_allow_html=True)

def load_market_data():
    import yfinance as yf
    return yf.download(DEFAULT_SYMBOL, period="1d", interval="1m")

# --- SIDEBAR: RESUMO DO DIA ---
st.sidebar.title("📑 Resumo do Dia")

# Verificação de Saúde do Banco
from database.db_manager import check_db_connection
db_ok, db_msg = check_db_connection()

if not db_ok:
    st.sidebar.error(f"❌ Erro de Banco: {db_msg[:50]}...")
    st.warning("O painel está operando em modo offline ou com erro de conexão ao banco.")
    daily_pnl = 0.0
    open_pos = pd.DataFrame()
else:
    st.sidebar.success("✅ Banco Conectado")
    daily_pnl = get_daily_pnl(DEFAULT_SYMBOL)
    open_pos = get_open_position(DEFAULT_SYMBOL)

pnl_color = "green" if daily_pnl >= 0 else "red"
st.sidebar.markdown(f"### PnL Hoje: <span style='color:{pnl_color}'>{daily_pnl*100:.2f}%</span>", unsafe_allow_html=True)
st.sidebar.write(f"**Ativo:** {DEFAULT_SYMBOL}")
st.sidebar.divider()

open_pos = get_open_position(DEFAULT_SYMBOL)
if not open_pos.empty:
    st.sidebar.success(f"📌 Posição Aberta em ${open_pos.iloc[0]['price']:.2f}")
    st.sidebar.info(f"Sinal Original: {open_pos.iloc[0]['signal']}")
else:
    st.sidebar.warning("⚪ Sem Posições Abertas")

st.sidebar.divider()
st.sidebar.header("🔌 Status de Conexão")
st.sidebar.write("🟢 **TWS (Local):** Conectado")
db_status_icon = "🟢" if db_ok else "🔴"
st.sidebar.write(f"{db_status_icon} **Banco (Railway):** {'Sincronizado' if db_ok else 'Desconectado'}")

# --- PAINEL PRINCIPAL ---
st.title(f"📊 {DEFAULT_SYMBOL} - Espelhamento TWS")

# Tentar inicializar o banco e SINCRONIZAR HISTÓRICO COM IA
if db_ok:
    try:
        from database.db_manager import init_db, sync_daily_history
        init_db()
        sync_daily_history() # IA: Recupera o que aconteceu hoje se o banco estiver vazio
    except Exception as e:
        st.error(f"Falha ao sincronizar tabelas/IA: {e}")

# Métricas de Topo
col1, col2, col3, col4 = st.columns(4)

# Inicializa variáveis para evitar NameError se db_ok for False
signals_df = pd.DataFrame()
if db_ok:
    try:
        signals_df = get_recent_signals(1)
    except:
        pass

if not signals_df.empty:
    last_s = signals_df.iloc[0]
    col1.metric("Último Sinal", last_s['signal'])
    col2.metric("Preço de Entrada", f"${last_s['price']:.2f}")
    col3.metric("Status", last_s['status'])
    col4.metric("Capital em Risco", f"${last_s['risk_value']:.2f}")

# Gráfico em Tempo Real
st.subheader("📈 Gráfico de Preços (1m)")
market_df = load_market_data()

if not market_df.empty:
    fig = go.Figure(data=[go.Candlestick(x=market_df.index,
                open=market_df['Open'], high=market_df['High'],
                low=market_df['Low'], close=market_df['Close'],
                name="Market")])
    fig.update_layout(template="plotly_dark", height=500, margin=dict(l=10, r=10, t=10, b=10))
    st.plotly_chart(fig, use_container_width=True)

# Histórico de Execuções
st.subheader("📜 Histórico de Sinais e Ordens")
if db_ok:
    try:
        all_signals = get_recent_signals(20)
        if not all_signals.empty:
            st.table(all_signals[['timestamp', 'symbol', 'price', 'signal', 'pnl_percent', 'status']])
        else:
            st.info("Nenhum sinal registrado ainda.")
    except Exception as e:
        st.error("Erro ao carregar histórico.")
else:
    st.warning("Histórico indisponível sem conexão ao banco.")

# Botão de Execução Forçada (Nota: Pode falhar em nuvem se o ambiente for read-only)
if st.sidebar.button("Forçar Análise Agora"):
    try:
        import subprocess
        subprocess.run(["python", "main.py"])
        st.success("Análise executada!")
        st.rerun()
    except Exception as e:
        st.sidebar.error(f"Erro ao executar: {e}")

st.caption(f"Última atualização: {datetime.now().strftime('%H:%M:%S')}")
# Removido st.rerun() infinito para evitar instabilidade no Railway.
# O Streamlit já gerencia o estado da sessão e o refresh automático pode ser feito pelo usuário ou widgets específicos.
