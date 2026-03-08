from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database.db_manager import get_recent_signals, get_daily_pnl, check_db_connection, analyze_market_with_ai, save_signal
from config.settings import DEFAULT_SYMBOL
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

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
        # Tenta pegar o preço mais recente de forma robusta
        data = ticker.history(period="1d", interval="1m")
        if not data.empty:
            price = float(data['Close'].iloc[-1].iloc[0]) if isinstance(data['Close'].iloc[-1], pd.Series) else float(data['Close'].iloc[-1])
            open_price = float(data['Open'].iloc[0].iloc[0]) if isinstance(data['Open'].iloc[0], pd.Series) else float(data['Open'].iloc[0])
            change = float(((price - open_price) / open_price) * 100)
        else:
            price = 0.0
            change = 0.0
    except:
        price = 0.0
        change = 0.0
    
    return {
        "connected": True,
        "db_online": db_ok,
        "symbol": DEFAULT_SYMBOL,
        "price": price,
        "change": change,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/chart")
async def get_chart_data(symbol: str = None):
    try:
        if not symbol:
            symbol = DEFAULT_SYMBOL
        data = yf.download(symbol, period="1d", interval="5m", progress=False)
        if data.empty:
            return []
        
        # Formata para Lightweight Charts (time em timestamp Unix)
        # IMPORTANTE: Garantir que o timestamp seja em segundos para o React
        chart_data = []
        for index, row in data.iterrows():
            chart_data.append({
                "time": int(index.timestamp()),
                "open": float(row['Open'].iloc[0]) if isinstance(row['Open'], pd.Series) else float(row['Open']),
                "high": float(row['High'].iloc[0]) if isinstance(row['High'], pd.Series) else float(row['High']),
                "low": float(row['Low'].iloc[0]) if isinstance(row['Low'], pd.Series) else float(row['Low']),
                "close": float(row['Close'].iloc[0]) if isinstance(row['Close'], pd.Series) else float(row['Close']),
            })
        return chart_data
    except Exception as e:
        print(f"Erro no gráfico para {symbol}: {e}")
        return []

@app.get("/api/ai-insights")
async def get_ai_insights():
    try:
        data = yf.download(DEFAULT_SYMBOL, period="1d", interval="15m", progress=False)
        ai_signals = analyze_market_with_ai(data)
        
        insights = []
        if not ai_signals:
            insights.append("IA: Mercado lateralizado. Nenhuma oportunidade de rompimento detectada no momento.")
        else:
            insights.append(f"IA: Detectados {len(ai_signals)} sinais de força compradora no histórico recente.")
            insights.append(f"IA: O símbolo {DEFAULT_SYMBOL} apresenta suporte sólido em níveis de acumulação.")
        
        return {"insights": insights}
    except:
        return {"insights": ["IA: Aguardando mais dados de mercado para análise."]}

@app.get("/api/pnl")
async def get_pnl():
    pnl = get_daily_pnl(DEFAULT_SYMBOL)
    return {"pnl": pnl}

@app.post("/api/order")
async def submit_order(order: dict):
    try:
        symbol = order.get("symbol", DEFAULT_SYMBOL)
        price = order.get("price", 0.0)
        signal = order.get("signal", "BUY")
        qty = order.get("qty", 100)
        
        # Simula o cálculo de risco (1% do capital fictício de $10k)
        risk_value = (price * qty) * 0.01
        
        save_signal(symbol, price, signal, risk_value)
        return {"status": "success", "message": f"Order {signal} for {qty} {symbol} at ${price} submitted to database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/signals")
async def get_signals():
    signals = get_recent_signals(15)
    if signals.empty:
        return []
    # Converter timestamps para string para o JSON
    df = signals.copy()
    if 'timestamp' in df.columns:
        df['timestamp'] = df['timestamp'].astype(str)
    return df.to_dict(orient="records")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
