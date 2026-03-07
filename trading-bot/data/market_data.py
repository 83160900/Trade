import yfinance as yf

def get_data(symbol):
    data = yf.download(symbol, period="5d", interval="5m")
    return data