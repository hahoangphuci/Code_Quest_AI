from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_from_directory
import psycopg2
import hashlib
import uuid
import traceback
from datetime import datetime

app = Flask(__name__, template_folder='pages', static_folder='assets')
app.secret_key = 'codequest-ai-secret-key-2024'

# Enable CORS for development
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': '5433',
    'database': 'codequest_db',
    'user': 'postgres',
    'password': '123456'
}

def get_db_connection():
    """Tạo kết nối database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_database():
    """Khởi tạo database và bảng"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Tạo bảng users
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Tạo bảng sessions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) REFERENCES users(id),
                session_token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Database tables created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
        conn.close()
        return False

def hash_password(password):
    """Hash mật khẩu"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hash_value):
    """Xác thực mật khẩu"""
    return hashlib.sha256(password.encode()).hexdigest() == hash_value

# Routes
@app.route('/')
def index():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/auth')
def auth():
    return render_template('auth.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/features')
def features():
    return render_template('features.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/careers')
def careers():
    return render_template('careers.html')

@app.route('/clients')
def clients():
    return render_template('clients.html')

@app.route('/legal')
def legal():
    return render_template('legal.html')

# Test route
@app.route('/test')
def test():
    return jsonify({'status': 'OK', 'message': 'Server is running!'})

# Static files route
@app.route('/assets/<path:filename>')
def assets(filename):
    try:
        return send_from_directory('assets', filename)
    except Exception as e:
        print(f"Error serving static file {filename}: {e}")
        return "File not found", 404

# Error handlers
@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'message': 'API endpoint not found'}), 404
    return render_template('home.html'), 404

@app.errorhandler(500)
def internal_error(error):
    print(f"Internal server error: {error}")
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'message': 'Internal server error'}), 500
    return "Internal Server Error", 500

# API Routes
@app.route('/api/auth/register', methods=['POST'])  
def register():
    """API đăng ký"""
    try:
        print("=== REGISTER REQUEST ===")
        data = request.get_json()
        print(f"Request data: {data}")
        
        if not data:
            return jsonify({'success': False, 'message': 'Không có dữ liệu'}), 400
        
        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        print(f"Parsed data: name={full_name}, email={email}, password_len={len(password)}")
        
        if not full_name or not email or not password:
            return jsonify({'success': False, 'message': 'Vui lòng nhập đầy đủ thông tin'}), 400
        
        if len(password) < 8:
            return jsonify({'success': False, 'message': 'Mật khẩu phải có ít nhất 8 ký tự'}), 400
        
        conn = get_db_connection()
        if not conn:
            print("Database connection failed")
            return jsonify({'success': False, 'message': 'Lỗi kết nối database'}), 500
        
        cursor = conn.cursor()
        
        # Kiểm tra email đã tồn tại
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            print(f"Email {email} already exists")
            return jsonify({'success': False, 'message': 'Email này đã được sử dụng'}), 400
        
        # Tạo user mới
        user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        
        cursor.execute('''
            INSERT INTO users (id, full_name, email, password_hash)
            VALUES (%s, %s, %s, %s)
        ''', (user_id, full_name, email, password_hash))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"User created successfully: {email}")
        return jsonify({
            'success': True,
            'message': 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.'
        }), 201
        
    except Exception as e:
        print(f"Register error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra, vui lòng thử lại'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """API đăng nhập"""
    try:
        print("=== LOGIN REQUEST ===")
        data = request.get_json()
        print(f"Request data: {data}")
        
        if not data:
            return jsonify({'success': False, 'message': 'Không có dữ liệu'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        print(f"Login attempt: email={email}, password_len={len(password)}")
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Vui lòng nhập đầy đủ thông tin'}), 400
        
        conn = get_db_connection()
        if not conn:
            print("Database connection failed")
            return jsonify({'success': False, 'message': 'Lỗi kết nối database'}), 500
        
        cursor = conn.cursor()
        
        # Tìm user
        cursor.execute('''
            SELECT id, full_name, email, password_hash, is_active 
            FROM users WHERE email = %s
        ''', (email,))
        
        user = cursor.fetchone()
        print(f"User found: {user is not None}")
        
        if not user or not verify_password(password, user[3]):
            cursor.close()
            conn.close()
            print("Invalid credentials")
            return jsonify({'success': False, 'message': 'Email hoặc mật khẩu không chính xác'}), 401
        
        if not user[4]:  # is_active
            cursor.close()
            conn.close()
            print("User is inactive")
            return jsonify({'success': False, 'message': 'Tài khoản đã bị khóa'}), 401
        
        # Tạo session
        session_token = str(uuid.uuid4())
        session['user_id'] = user[0]
        session['user_email'] = user[2]
        session['user_name'] = user[1]
        
        # Cập nhật last_login
        cursor.execute('''
            UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s
        ''', (user[0],))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"Login successful for: {email}")
        return jsonify({
            'success': True,
            'message': 'Đăng nhập thành công!',
            'user': {
                'id': user[0],
                'full_name': user[1],
                'email': user[2]
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra, vui lòng thử lại'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """API đăng xuất"""
    session.clear()
    return jsonify({'success': True, 'message': 'Đăng xuất thành công'}), 200

@app.route('/api/auth/check-session', methods=['GET'])
def check_session():
    """Kiểm tra session"""
    try:
        print("=== CHECK SESSION REQUEST ===")
        user_id = session.get('user_id')
        print(f"Session user_id: {user_id}")
        
        if user_id:
            return jsonify({
                'success': True,
                'authenticated': True,
                'user': {
                    'id': session.get('user_id'),
                    'full_name': session.get('user_name'),
                    'email': session.get('user_email')
                }
            }), 200
        else:
            return jsonify({'success': False, 'authenticated': False}), 200
    except Exception as e:
        print(f"Check session error: {e}")
        return jsonify({'success': False, 'authenticated': False}), 200

@app.route('/api/auth/update-profile', methods=['POST'])
def update_profile():
    """API cập nhật thông tin user"""
    try:
        print("=== UPDATE PROFILE REQUEST ===")
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'message': 'Chưa đăng nhập'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Không có dữ liệu'}), 400
        
        full_name = data.get('full_name', '').strip()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        print(f"Update request for user_id: {user_id}")
        print(f"Data: full_name={full_name}, has_current_password={bool(current_password)}, has_new_password={bool(new_password)}")
        
        if not full_name:
            return jsonify({'success': False, 'message': 'Vui lòng nhập họ và tên'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Lỗi kết nối database'}), 500
        
        cursor = conn.cursor()
        
        # Get current user data
        cursor.execute('SELECT full_name, email, password_hash FROM users WHERE id = %s', (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Không tìm thấy user'}), 404
        
        # Check current password if changing password
        if current_password and new_password:
            if not verify_password(current_password, user_data[2]):
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'message': 'Mật khẩu hiện tại không đúng'}), 400
            
            if len(new_password) < 8:
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'message': 'Mật khẩu mới phải có ít nhất 8 ký tự'}), 400
            
            # Update both name and password
            new_password_hash = hash_password(new_password)
            cursor.execute('''
                UPDATE users 
                SET full_name = %s, password_hash = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            ''', (full_name, new_password_hash, user_id))
            
            print("Updated both name and password")
        else:
            # Update only name
            cursor.execute('''
                UPDATE users 
                SET full_name = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            ''', (full_name, user_id))
            
            print("Updated only name")
        
        conn.commit()
        
        # Update session
        session['user_name'] = full_name
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Cập nhật thông tin thành công!',
            'user': {
                'id': user_id,
                'full_name': full_name,
                'email': user_data[1]
            }
        }), 200
        
    except Exception as e:
        print(f"Update profile error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra, vui lòng thử lại'}), 500

if __name__ == '__main__':
    print("🚀 Starting CodeQuest AI...")
    
    # Tạo database nếu chưa có
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Kiểm tra database có tồn tại không
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{DB_CONFIG['database']}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f'CREATE DATABASE {DB_CONFIG["database"]}')
            print(f"✅ Database '{DB_CONFIG['database']}' created successfully!")
        else:
            print(f"✅ Database '{DB_CONFIG['database']}' already exists.")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error with database: {e}")
    
    # Khởi tạo tables
    if init_database():
        print("✅ CodeQuest AI Backend is ready!")
        print("🌐 Server starting on http://localhost:8000")
        print("🔑 Auth endpoints:")
        print("   - POST /api/auth/register")
        print("   - POST /api/auth/login")
        print("   - POST /api/auth/logout")
        print("   - GET  /api/auth/check-session")
        
        # Chạy app
        app.run(debug=True, host='127.0.0.1', port=8000)
    else:
        print("❌ Failed to initialize database")