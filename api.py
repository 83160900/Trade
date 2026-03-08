from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database.db_manager import get_recent_signals, get_daily_pnl, check_db_connection
from config.settings import DEFAULT_SYMBOL
import yfinance as yf
from datetime import datetime

app = FastAPI(title="TWS Mirror API")

# Configuração do CORS para o React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, use a URL específica do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
async def get_status():
    db_ok, _ = check_db_connection()
    try:
        ticker = yf.Ticker(DEFAULT_SYMBOL)
        price = ticker.fast_info.last_price
    except:
        price = 0.0
    
    return {
        "connected": True,
        "db_online": db_ok,
        "symbol": DEFAULT_SYMBOL,
        "price": price,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/pnl")
async def get_pnl():
    pnl = get_daily_pnl(DEFAULT_SYMBOL)
    return {"pnl": pnl}

@app.get("/api/signals")
async def get_signals():
    signals = get_recent_signals(10)
    if signals.empty:
        return []
    return signals.to_dict(orient="records")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
