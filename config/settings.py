# Configurações do robô de trading
import os

# IBKR Connection (TWS instalado em C:\broker\tws)
IB_HOST = '127.0.0.1'
IB_PORT = 7497  # 7497 para Paper Trading, 7496 para Live
CLIENT_ID = 1

# Banco de Dados PostgreSQL (Railway)
# Usando a URL pública real para o seu PC e o Railway usar DATABASE_URL automático
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:WrTbVZqHVcYRVcXAAYIVuEFvrenWMRTk@turntable.proxy.rlwy.net:44872/railway")

# Strategy Params
DEFAULT_SYMBOL = 'AAPL'
RISK_PERCENT = 0.01  # Stop Loss diário: 1% do capital total

# Meta de Lucro e Trailing Stop
TAKE_PROFIT_PERCENT = 0.10  # 10% de ganho
TRAILING_STOP_TRIGGER = 0.04 # Ativa proteção ao atingir 4% de lucro
MIN_PROFIT_TO_LOCK = 0.01   # Se chegar a 4%, garante pelo menos 1% de lucro se cair

# Horário de Mercado (NY Time)
MARKET_OPEN = "09:30"
MARKET_CLOSE = "16:00"
