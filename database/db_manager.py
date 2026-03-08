import os
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
from config.settings import DB_URL

# Criar motor de conexão SQLAlchemy para PostgreSQL
def get_engine():
    # 1. Tenta DATABASE_URL (Railway) - Se estiver vazia ou inválida, usa o settings
    url = os.environ.get("DATABASE_URL")
    
    if not url or "://" not in str(url):
        url = DB_URL
        print("Usando URL do settings.py")
    else:
        print("Usando DATABASE_URL do Railway")

    try:
        # Correção crucial para o SQLAlchemy no Railway/Heroku
        if str(url).startswith("postgres://"):
            url = str(url).replace("postgres://", "postgresql://", 1)
            
        return create_engine(
            str(url), 
            pool_pre_ping=True,
            connect_args={'connect_timeout': 10}
        )
    except Exception as e:
        print(f"Erro ao criar engine: {e}")
        return None

# Engine global inicializado
engine = get_engine()

def check_db_connection():
    """Verifica se a conexão com o banco está ativa."""
    if engine is None:
        return False, "URL do banco de dados não configurada ou inválida."
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True, "Conectado"
    except Exception as e:
        return False, str(e)

def init_db():
    """Cria as tabelas se não existirem no PostgreSQL."""
    try:
        with engine.connect() as conn:
            # Tabela para logs de sinais e preços
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS signals (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    symbol TEXT,
                    price REAL,
                    signal TEXT,
                    risk_value REAL,
                    pnl_percent REAL DEFAULT 0,
                    status TEXT DEFAULT 'OPEN'
                )
            '''))
            
            # Tabela para o histórico de mercado
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS market_history (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP,
                    symbol TEXT,
                    "open" REAL,
                    "high" REAL,
                    "low" REAL,
                    "close" REAL,
                    volume REAL
                )
            '''))
            conn.commit()
            print("Banco de dados inicializado com sucesso.")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")

def save_signal(symbol, price, signal, risk_value):
    """Salva o sinal gerado no banco PostgreSQL."""
    if engine is None:
        print("Erro: Engine não inicializado. Sinal não salvo.")
        return
    df = pd.DataFrame([{
        'timestamp': datetime.now(),
        'symbol': symbol,
        'price': float(price),
        'signal': signal,
        'risk_value': float(risk_value),
        'status': 'OPEN',
        'pnl_percent': 0.0
    }])
    df.to_sql('signals', engine, if_exists='append', index=False)

def get_daily_pnl(symbol):
    """Calcula o PnL total do dia."""
    if engine is None: return 0
    today = datetime.now().strftime('%Y-%m-%d')
    query = f"SELECT SUM(pnl_percent) FROM signals WHERE symbol='{symbol}' AND timestamp::text LIKE '{today}%' AND status='CLOSED'"
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query)).fetchone()[0]
        return result if result else 0
    except:
        return 0

def get_open_position(symbol):
    """Busca posição aberta no banco."""
    if engine is None: return pd.DataFrame()
    query = f"SELECT * FROM signals WHERE symbol='{symbol}' AND status='OPEN' LIMIT 1"
    try:
        return pd.read_sql(query, engine)
    except:
        return pd.DataFrame()

def close_position(pos_id, pnl_percent):
    """Fecha a posição no banco."""
    if engine is None: return
    try:
        with engine.connect() as conn:
            conn.execute(text("UPDATE signals SET status='CLOSED', pnl_percent=:pnl WHERE id=:id"), 
                         {"pnl": pnl_percent, "id": pos_id})
            conn.commit()
    except Exception as e:
        print(f"Erro ao fechar posição: {e}")

def get_recent_signals(limit=10):
    """Busca sinais recentes."""
    if engine is None: return pd.DataFrame()
    query = f"SELECT * FROM signals ORDER BY timestamp DESC LIMIT {limit}"
    try:
        return pd.read_sql(query, engine)
    except:
        return pd.DataFrame()
