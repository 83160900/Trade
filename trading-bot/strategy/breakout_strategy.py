import pandas as pd

def breakout_signal(data):
    if data.empty:
        return "HOLD"
    
    high = data['High'].rolling(20).max()
    
    # Se o yfinance retornar MultiIndex (Ticker no nível superior), selecionamos o valor escalar
    last_price = data['Close'].iloc[-1]
    if isinstance(last_price, pd.Series):
        last_price = last_price.iloc[0]
        
    prev_high = high.iloc[-2]
    if isinstance(prev_high, pd.Series):
        prev_high = prev_high.iloc[0]

    if last_price > prev_high:
        return "BUY"

    return "HOLD"