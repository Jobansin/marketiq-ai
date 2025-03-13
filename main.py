import os
import time
import requests
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you can restrict this later)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define Stock Model
class Stock(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    open_price = Column(Float)
    close_price = Column(Float)

# Create tables in database
Base.metadata.create_all(bind=engine)

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

# In-memory cache to store stock data (symbol → {data, timestamp})
cache = {}

@app.get("/")
def home():
    return {"message": "Welcome to MarketIQ AI!"}

@app.get("/stock/{symbol}")
def get_stock_price(symbol: str, db: Session = Depends(get_db)):
    """Fetch stock data with caching and API limit handling."""
    
    # Check cache: return data if it's less than 10 minutes old
    if symbol in cache and time.time() - cache[symbol]["timestamp"] < 600:
        return cache[symbol]["data"]

    # Fetch from API if cache is empty/expired
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": symbol,
        "interval": "5min",
        "apikey": API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    # Check if API key limit is reached
    if "Information" in data and "API key" in data["Information"]:
        raise HTTPException(status_code=429, detail="API limit exceeded. Please try again later.")

    # Validate API response
    if "Time Series (5min)" in data:
        cache[symbol] = data
        latest_time = list(data["Time Series (5min)"].keys())[0]
        open_price = float(data["Time Series (5min)"][latest_time]["1. open"])
        close_price = float(data["Time Series (5min)"][latest_time]["4. close"])

        # Store in PostgreSQL
        stock_entry = Stock(symbol=symbol, open_price=open_price, close_price=close_price)
        db.add(stock_entry)
        db.commit()

        # Save in cache
        cache[symbol] = {"data": data, "timestamp": time.time()}
        return data

    raise HTTPException(status_code=400, detail="Invalid response from API. Please check the stock symbol.")

