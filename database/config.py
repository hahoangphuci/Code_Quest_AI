import os
from urllib.parse import quote_plus

class DatabaseConfig:
    # PostgreSQL configuration
    DB_HOST = 'localhost'
    DB_PORT = '5433'  # Cổng PostgreSQL từ pgAdmin
    DB_NAME = 'codequest_db'
    DB_USER = 'postgres'
    DB_PASSWORD = '123456'  # Password từ pgAdmin
    
    # Tạo database URL với encoding password
    @classmethod
    def get_database_url(cls):
        password_encoded = quote_plus(cls.DB_PASSWORD)
        return f"postgresql://{cls.DB_USER}:{password_encoded}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
    
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'codequest-ai-secret-key-2024'
    SQLALCHEMY_DATABASE_URI = get_database_url.__func__()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }