import os
import requests
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

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

# API Key for Alpha Vantage
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

@app.get("/")
def home():
    return {"message": "Welcome to MarketIQ AI!"}

@app.get("/stock/{symbol}")
def get_stock_price(symbol: str, db: Session = Depends(get_db)):
    """Fetch stock data and store it in the database."""
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": symbol,
        "interval": "5min",
        "apikey": API_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    if "Time Series (5min)" in data:
        latest_time = list(data["Time Series (5min)"].keys())[0]
        open_price = float(data["Time Series (5min)"][latest_time]["1. open"])
        close_price = float(data["Time Series (5min)"][latest_time]["4. close"])

        stock_entry = Stock(symbol=symbol, open_price=open_price, close_price=close_price)
        db.add(stock_entry)
        db.commit()

    return data

