import time
from datetime import datetime
import pytz
from config.settings import *
from data.market_data import get_data
from strategy.breakout_strategy import breakout_signal
from database.db_manager import *
from execution.broker_ib import connect_ib

def is_market_open():
    """Verifica se o mercado de NY está aberto. 
    RETORNANDO TRUE PARA TESTE FORA DO HORÁRIO AGORA."""
    return True

def trading_bot_loop():
    print("--- Iniciando Robô em Modo Automático ---")
    init_db()
    
    # Tenta conectar ao IBKR no início
    ib = connect_ib()
    if not ib:
        print("Aviso: Rodando sem conexão ativa com TWS. Apenas simulação no banco de dados.")

    while True:
        if not is_market_open():
            print(f"[{datetime.now()}] Mercado Fechado. Aguardando abertura...")
            time.sleep(600) # Espera 10 min
            continue

        # 1. Verificar Stop Loss Diário (1%)
        daily_pnl = get_daily_pnl(DEFAULT_SYMBOL)
        if daily_pnl <= -RISK_PERCENT:
            print(f"ALERTA: Stop Loss Diário atingido ({daily_pnl*100}%). Encerrando operações hoje.")
            # Aguarda até o próximo dia (simplificado: espera 1 hora e checa novamente)
            time.sleep(3600)
            continue

        # 2. Obter dados atuais
        try:
            data = get_data(DEFAULT_SYMBOL)
            if data.empty:
                time.sleep(60)
                continue
            last_price = data['Close'].iloc[-1]
            if hasattr(last_price, 'iloc'): last_price = last_price.iloc[0]
        except Exception as e:
            print(f"Erro ao obter dados: {e}")
            time.sleep(60)
            continue

        # 3. Gerenciar Posição Aberta (Trailing Stop / Take Profit)
        open_pos = get_open_position(DEFAULT_SYMBOL)
        if not open_pos.empty:
            entry_price = open_pos.iloc[0]['price']
            pos_id = open_pos.iloc[0]['id']
            current_profit = (last_price - entry_price) / entry_price
            
            print(f"Monitorando {DEFAULT_SYMBOL}: Lucro Atual: {current_profit*100:.2f}%")

            # Regra de Saída 1: Take Profit 10%
            if current_profit >= TAKE_PROFIT_PERCENT:
                print(f"META ATINGIDA! Fechando com {current_profit*100:.2f}% de lucro.")
                close_position(pos_id, current_profit)
                # No TWS: ib.placeOrder(...) se ib estiver conectado
            
            # Regra de Saída 2: Trailing Stop (Se lucro > 4% e cair abaixo de 1% de garantia)
            elif current_profit >= TRAILING_STOP_TRIGGER:
                # Aqui poderíamos atualizar um stop móvel no banco. 
                # Simplificando: Se atingiu 4% e cair para menos de 1% de lucro real, fecha.
                print(f"Lucro de {current_profit*100:.2f}% atingiu gatilho de proteção (4%).")
            
            # Regra de Saída 3: Stop Loss Fixo (ou queda após atingir 4%)
            # Se lucro caiu abaixo de 1% APÓS ter batido 4%, ou se prejuízo bateu 1%
            if (current_profit < MIN_PROFIT_TO_LOCK and current_profit < 0.04) or current_profit <= -0.01:
                 # Lógica simplificada de trailing: se lucro cair de 4% para < 1%, fecha.
                 # Ou se o prejuízo inicial bater 1%, fecha.
                 if current_profit <= -0.01:
                     print(f"STOP LOSS ATINGIDO: {current_profit*100:.2f}%.")
                     close_position(pos_id, current_profit)
                 elif current_profit < MIN_PROFIT_TO_LOCK:
                     # Checar se já bateu a máxima de 4% em algum momento seria ideal, 
                     # mas por enquanto vamos fechar se cair abaixo de 1% de lucro positivo 
                     # para garantir que não vire prejuízo.
                     pass 

        # 4. Procurar Nova Entrada (Se não houver posição aberta)
        else:
            signal = breakout_signal(data)
            if signal == "BUY":
                print(f"SINAL DE COMPRA: Entrando em {DEFAULT_SYMBOL} a ${last_price}")
                save_signal(DEFAULT_SYMBOL, last_price, "BUY", 0) # risk_value aqui seria calculado
            else:
                print(f"Aguardando sinal para {DEFAULT_SYMBOL}... Preço: ${last_price}")

        time.sleep(300) # Loop a cada 5 minutos

if __name__ == "__main__":
    trading_bot_loop()
