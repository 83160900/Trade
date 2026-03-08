import yfinance as yf

def get_data(symbol, period="1d", interval="1m"):
    """
    Obtém dados de mercado via yfinance.
    Default: 1 dia, intervalo de 1 minuto para o robô.
    """
    try:
        data = yf.download(symbol, period=period, interval=interval, progress=False)
        return data
    except Exception as e:
        print(f"Erro ao baixar dados para {symbol}: {e}")
        return pd.DataFrame()

def get_watchlist_data(symbols):
    """
    Busca preços reais e variação para uma lista de símbolos.
    """
    results = {}
    try:
        data = yf.download(symbols, period="2d", interval="1d", progress=False)
        for sym in symbols:
            try:
                if len(symbols) > 1:
                    last_close = data['Close'][sym].iloc[-1]
                    prev_close = data['Close'][sym].iloc[-2]
                else:
                    last_close = data['Close'].iloc[-1]
                    prev_close = data['Close'].iloc[-2]
                
                change = ((last_close - prev_close) / prev_close) * 100
                results[sym] = {"price": last_close, "change": change}
            except:
                results[sym] = {"price": 0.0, "change": 0.0}
    except Exception as e:
        print(f"Erro na Watchlist: {e}")
    return results