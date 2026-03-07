from data.market_data import get_data
from strategy.breakout_strategy import breakout_signal
from risk.risk_manager import calculate_position
from config.settings import DEFAULT_SYMBOL, RISK_PERCENT
from database.db_manager import init_db, save_signal, save_market_data
import pandas as pd

def main():
    print(f"--- Iniciando Robô de Trading para {DEFAULT_SYMBOL} ---")
    
    # 0. Inicializar Banco de Dados
    init_db()
    
    # 1. Obter dados de mercado
    print("Coletando dados do yfinance...")
    try:
        data = get_data(DEFAULT_SYMBOL)
        if data.empty:
            print("Erro: Nenhum dado retornado.")
            return
    except Exception as e:
        print(f"Erro ao baixar dados: {e}")
        return

    # 2. Analisar sinal
    signal = breakout_signal(data)
    print(f"Sinal Gerado: {signal}")

    # 3. Calcular risco (exemplo com balance fictício de 10.000)
    balance = 10000
    risk_value = calculate_position(balance, RISK_PERCENT)
    print(f"Capital em risco (base $10k, {RISK_PERCENT*100}%): ${risk_value}")

    # 4. Salvar no Banco de Dados para aprendizado/histórico
    try:
        last_price = data['Close'].iloc[-1]
        if isinstance(last_price, pd.Series):
            last_price = last_price.iloc[0]
            
        save_signal(DEFAULT_SYMBOL, last_price, signal, risk_value)
        # save_market_data(DEFAULT_SYMBOL, data.tail(5)) # Salva últimos 5 candles para histórico
        print("Dados salvos no banco de dados com sucesso.")
    except Exception as e:
        print(f"Erro ao salvar dados no banco: {e}")

    print("--- Fim da execução inicial ---")
    print("Nota: A conexão real com IBKR requer o TWS/Gateway rodando na porta 7497.")

if __name__ == "__main__":
    main()