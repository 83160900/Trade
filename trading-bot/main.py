from data.market_data import get_data
from strategy.breakout_strategy import breakout_signal
from risk.risk_manager import calculate_position
from config.settings import DEFAULT_SYMBOL, RISK_PERCENT

def main():
    print(f"--- Iniciando Robô de Trading para {DEFAULT_SYMBOL} ---")
    
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

    print("--- Fim da execução inicial ---")
    print("Nota: A conexão real com IBKR requer o TWS/Gateway rodando na porta 7497.")

if __name__ == "__main__":
    main()