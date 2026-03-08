import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from config.settings import DB_URL, DEFAULT_SYMBOL
import os

# --- LÓGICA DE INTELIGÊNCIA ARTIFICIAL (ANÁLISE DE HISTÓRICO) ---
def analyze_market_with_ai(data):
    """
    Simula uma 'IA' que analisa o histórico do dia para preencher 
    lacunas de sinais se o robô estava desligado.
    """
    if data.empty: return []
    
    # Exemplo: Identifica os maiores rompimentos de alta do dia (High > Prev High)
    high_20 = data['High'].rolling(20).max().shift(1)
    breakouts = data[data['Close'] > high_20]
    
    signals = []
    for idx, row in breakouts.tail(5).iterrows(): # Pega os últimos 5 rompimentos
        signals.append({
            'timestamp': idx,
            'symbol': DEFAULT_SYMBOL,
            'price': float(row['Close']),
            'signal': 'BUY',
            'status': 'CLOSED',
            'pnl_percent': 0.01 # PnL simbólico para histórico
        })
    return signals

def sync_daily_history():
    """
    Sincroniza o histórico do dia no banco de dados se estiver vazio.
    Funciona como uma 'IA' que recupera o que aconteceu enquanto o robô estava off.
    """
    try:
        from data.market_data import get_data
        print("Sincronizando histórico do dia...")
        
        # 1. Verifica se já existem sinais hoje
        today = datetime.now().strftime('%Y-%m-%d')
        query = f"SELECT count(*) FROM signals WHERE timestamp::text LIKE '{today}%'"
        
        with engine.connect() as conn:
            count = conn.execute(text(query)).fetchone()[0]
        
        if count == 0:
            print("Histórico vazio. Executando análise de IA para recuperação...")
            # 2. Busca dados do dia todo
            data = get_data(DEFAULT_SYMBOL, period="1d", interval="5m")
            ai_signals = analyze_market_with_ai(data)
            
            # 3. Salva os sinais encontrados no banco
            for s in ai_signals:
                df = pd.DataFrame([s])
                df.to_sql('signals', engine, if_exists='append', index=False)
            print(f"Recuperação finalizada: {len(ai_signals)} sinais históricos inseridos.")
        else:
            print(f"Banco já contém {count} sinais para hoje. Sincronização ignorada.")
            
    except Exception as e:
        print(f"Erro na sincronização de IA: {e}")

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
