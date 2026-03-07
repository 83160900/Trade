from ib_insync import *

def connect_ib():
    ib = IB()
    try:
        ib.connect('127.0.0.1', 7497, clientId=1)
    except Exception as e:
        print(f"Erro ao conectar ao IB: {e}")
        return None
    return ib