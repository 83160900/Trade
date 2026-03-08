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