import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
from config.settings import DB_URL

# Criar motor de conexão SQLAlchemy para PostgreSQL
engine = create_engine(DB_URL)

def init_db():
    """Cria as tabelas se não existirem no PostgreSQL."""
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

def save_signal(symbol, price, signal, risk_value):
    """Salva o sinal gerado no banco PostgreSQL."""
    df = pd.DataFrame([{
        'timestamp': datetime.now(),
        'symbol': symbol,
        'price': float(price),
        'signal': signal,
        'risk_value': float(risk_value),
        'status': 'OPEN'
    }])
    df.to_sql('signals', engine, if_exists='append', index=False)

def get_daily_pnl(symbol):
    """Calcula o PnL total do dia."""
    today = datetime.now().strftime('%Y-%m-%d')
    query = f"SELECT SUM(pnl_percent) FROM signals WHERE symbol='{symbol}' AND timestamp::text LIKE '{today}%' AND status='CLOSED'"
    with engine.connect() as conn:
        result = conn.execute(text(query)).fetchone()[0]
    return result if result else 0

def get_open_position(symbol):
    """Busca posição aberta no banco."""
    query = f"SELECT * FROM signals WHERE symbol='{symbol}' AND status='OPEN' LIMIT 1"
    return pd.read_sql(query, engine)

def close_position(pos_id, pnl_percent):
    """Fecha a posição no banco."""
    with engine.connect() as conn:
        conn.execute(text("UPDATE signals SET status='CLOSED', pnl_percent=:pnl WHERE id=:id"), 
                     {"pnl": pnl_percent, "id": pos_id})
        conn.commit()

def get_recent_signals(limit=10):
    """Busca sinais recentes."""
    query = f"SELECT * FROM signals ORDER BY timestamp DESC LIMIT {limit}"
    return pd.read_sql(query, engine)
