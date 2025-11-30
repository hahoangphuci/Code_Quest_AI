from flask import Flask
from database.models import db, User, Session
from database.config import DatabaseConfig
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database_if_not_exists():
    """Tạo database nếu chưa tồn tại"""
    try:
        # Kết nối tới PostgreSQL server (không chỉ định database)
        conn = psycopg2.connect(
            host=DatabaseConfig.DB_HOST,
            port=DatabaseConfig.DB_PORT,
            user=DatabaseConfig.DB_USER,
            password=DatabaseConfig.DB_PASSWORD
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Kiểm tra database có tồn tại không
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{DatabaseConfig.DB_NAME}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f'CREATE DATABASE {DatabaseConfig.DB_NAME}')
            print(f"✅ Database '{DatabaseConfig.DB_NAME}' created successfully!")
        else:
            print(f"✅ Database '{DatabaseConfig.DB_NAME}' already exists.")
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def init_database(app: Flask):
    """Khởi tạo database với Flask app"""
    try:
        # Cấu hình Flask app
        app.config['SECRET_KEY'] = DatabaseConfig.SECRET_KEY
        app.config['SQLALCHEMY_DATABASE_URI'] = DatabaseConfig.get_database_url()
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = DatabaseConfig.SQLALCHEMY_TRACK_MODIFICATIONS
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = DatabaseConfig.SQLALCHEMY_ENGINE_OPTIONS
        
        # Khởi tạo database
        db.init_app(app)
        
        with app.app_context():
            # Tạo tất cả tables
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Tạo admin user mặc định nếu chưa có
            create_default_admin()
            
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False

def create_default_admin():
    """Tạo admin user mặc định"""
    try:
        admin_email = "admin@codequest.ai"
        admin = User.query.filter_by(email=admin_email).first()
        
        if not admin:
            admin = User(
                full_name="CodeQuest Admin",
                email=admin_email,
                is_verified=True
            )
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print(f"✅ Default admin created: {admin_email} / admin123")
        else:
            print(f"✅ Admin user already exists: {admin_email}")
            
    except Exception as e:
        print(f"❌ Error creating default admin: {e}")

def test_connection():
    """Test database connection"""
    try:
        conn = psycopg2.connect(
            host=DatabaseConfig.DB_HOST,
            port=DatabaseConfig.DB_PORT,
            user=DatabaseConfig.DB_USER,
            password=DatabaseConfig.DB_PASSWORD,
            database=DatabaseConfig.DB_NAME
        )
        cursor = conn.cursor()
        cursor.execute('SELECT version()')
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        print(f"✅ Database connection successful: {version[0]}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False