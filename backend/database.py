import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Expecting DATABASE_URL to be set in environment, defaulting to the docker-compose setup
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://insurance_user:insurance_password@localhost:5432/insurance_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Import models so Base knows about them before create_all
from models.schema import *
from sqlalchemy import text

# Enable pgvector extension and create tables
try:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        try:
            conn.execute(text("ALTER TABLE policies ADD COLUMN filename VARCHAR"))
        except Exception:
            pass # Column already exists
        conn.commit()
    Base.metadata.create_all(bind=engine)
    print("Database tables and pgvector extension initialized successfully.")
except Exception as e:
    print(f"Error initializing database: {e}")
