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
