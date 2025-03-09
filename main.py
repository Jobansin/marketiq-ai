import os
import requests
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = FastAPI()

# Retrieve API key from .env
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

@app.get("/")
def home():
    return {"message": "Welcome to MarketIQ AI!"}

@app.get("/stock/{symbol}")
def get_stock_price(symbol: str):
    """Fetch stock data for a given symbol."""
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": symbol,
        "interval": "5min",
        "apikey": API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    return response.json()
