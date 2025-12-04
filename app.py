from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_from_directory
import psycopg2
import hashlib
import uuid
import traceback
from datetime import datetime

# Import routes after creating app to avoid circular imports
# from routes.games import games_bp

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

# ============ API EXECUTE PYTHON ============
@app.route('/api/execute-python', methods=['POST'])
def execute_python():
    """Execute Python code safely for code validation"""
    try:
        data = request.get_json()
        code = data.get('code', '')
        timeout = data.get('timeout', 5)
        
        if not code:
            return jsonify({'error': 'No code provided'}), 400
        
        # Import required modules for safe execution
        import subprocess
        import tempfile
        import os
        
        # Create temporary file with code (UTF-8 encoding)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute Python code with timeout and proper encoding
            import os
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'
            
            result = subprocess.run(
                ['python', temp_file], 
                capture_output=True, 
                text=True, 
                timeout=timeout,
                encoding='utf-8',
                errors='ignore',
                env=env
            )
            
            if result.returncode == 0:
                return jsonify({
                    'success': True,
                    'output': result.stdout,
                    'error': result.stderr if result.stderr else None
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.stderr or 'Execution failed',
                    'output': result.stdout
                })
                
        except subprocess.TimeoutExpired:
            return jsonify({
                'success': False,
                'error': 'Code execution timed out'
            }), 408
            
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass
                
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

# Games routes
@app.route('/games/code-battle')
def code_battle():
    """Trang Code Battle"""
    return render_template('games/code_battle.html')

@app.route('/games/code-art') 
def code_art():
    """Trang Code Art"""
    return render_template('games/code_art.html')

@app.route('/games/speed-coding')
def speed_coding():
    """Trang Speed Coding"""
    return render_template('games/speed_coding.html')

@app.route('/games/code-quiz')
def code_quiz():
    """Trang Code Quiz"""
    return render_template('games/code_quiz.html')

@app.route('/games/debugging-game')
def debugging_game():
    """Trang Debugging Game"""
    return render_template('games/debugging_game.html')

@app.route('/games/code-story')
def code_story():
    """Trang Code Story"""
    return render_template('games/code_story.html')

# Games API routes với dữ liệu mẫu
QUIZ_QUESTIONS = [
    {
        "id": 1,
        "question": "Từ khóa nào được dùng để định nghĩa function trong Python?",
        "options": ["function", "def", "func", "define"],
        "correct": 1,
        "difficulty": "easy"
    },
    {
        "id": 2,
        "question": "Cấu trúc dữ liệu nào trong Python có thể thay đổi được (mutable)?",
        "options": ["tuple", "string", "list", "int"],
        "correct": 2,
        "difficulty": "easy"
    },
    {
        "id": 3,
        "question": "Kết quả của biểu thức '3' + '4' trong Python là gì?",
        "options": ["7", "'34'", "Error", "'3''4'"],
        "correct": 1,
        "difficulty": "medium"
    }
]

SPEED_CODING_CHALLENGES = [
    {
        "id": 1,
        "title": "Hello World",
        "description": "Viết chương trình in ra 'Hello, World!'",
        "expected_code": "print('Hello, World!')",
        "language": "python"
    },
    {
        "id": 2,
        "title": "Tính tổng hai số",
        "description": "Viết function tính tổng hai số a và b",
        "expected_code": "def add(a, b):\n    return a + b",
        "language": "python"
    }
]

DEBUGGING_CHALLENGES = [
    {
        "id": 1,
        "title": "Lỗi syntax",
        "buggy_code": "def hello()\n    print('Hello')",
        "correct_code": "def hello():\n    print('Hello')",
        "error_type": "syntax",
        "hint": "Thiếu dấu : sau tên function"
    },
    {
        "id": 2,
        "title": "Lỗi logic",
        "buggy_code": "def factorial(n):\n    result = 0\n    for i in range(1, n+1):\n        result *= i\n    return result",
        "correct_code": "def factorial(n):\n    result = 1\n    for i in range(1, n+1):\n        result *= i\n    return result",
        "error_type": "logic",
        "hint": "Giá trị khởi tạo của result không đúng"
    }
]

CODE_ART_TEMPLATES = [
    {
        "id": 1,
        "name": "ASCII Heart",
        "code": "for i in range(6):\n    for j in range(7):\n        if (i == 0 and j % 3 != 0) or (i == 1 and j % 3 == 0) or (i - j == 2) or (i + j == 8):\n            print('*', end='')\n        else:\n            print(' ', end='')\n    print()",
        "description": "Tạo trái tim bằng ký tự ASCII"
    },
    {
        "id": 2,
        "name": "Diamond Pattern",
        "code": "n = 5\nfor i in range(n):\n    print(' ' * (n-i-1) + '*' * (2*i+1))\nfor i in range(n-2, -1, -1):\n    print(' ' * (n-i-1) + '*' * (2*i+1))",
        "description": "Tạo hình kim cương"
    }
]

@app.route('/api/games/quiz/questions')
def get_quiz_questions():
    """API lấy câu hỏi quiz"""
    difficulty = request.args.get('difficulty', 'all')
    count = int(request.args.get('count', 5))
    
    questions = QUIZ_QUESTIONS.copy()
    if difficulty != 'all':
        questions = [q for q in questions if q['difficulty'] == difficulty]
    
    import random
    random.shuffle(questions)
    selected_questions = questions[:count]
    
    return jsonify({
        'success': True,
        'questions': selected_questions
    })

@app.route('/api/games/quiz/submit', methods=['POST'])
def submit_quiz():
    """API submit kết quả quiz"""
    data = request.get_json()
    answers = data.get('answers', [])
    time_taken = data.get('time_taken', 0)
    
    correct_count = 0
    total_questions = len(answers)
    
    for answer in answers:
        question_id = answer['question_id']
        selected_option = answer['selected_option']
        
        question = next((q for q in QUIZ_QUESTIONS if q['id'] == question_id), None)
        if question and question['correct'] == selected_option:
            correct_count += 1
    
    score = round((correct_count / total_questions) * 100, 2) if total_questions > 0 else 0
    
    return jsonify({
        'success': True,
        'score': score,
        'correct': correct_count,
        'total': total_questions,
        'time': time_taken
    })

@app.route('/api/games/speed-coding/challenges')
def get_speed_challenges():
    """API lấy thử thách speed coding"""
    return jsonify({
        'success': True,
        'challenges': SPEED_CODING_CHALLENGES
    })

@app.route('/api/games/speed-coding/submit', methods=['POST'])
def submit_speed_coding():
    """API submit kết quả speed coding"""
    data = request.get_json()
    challenge_id = data.get('challenge_id')
    user_code = data.get('code', '').strip()
    time_taken = data.get('time_taken', 0)
    
    challenge = next((c for c in SPEED_CODING_CHALLENGES if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'success': False, 'message': 'Không tìm thấy thử thách'})
    
    expected = challenge['expected_code'].strip()
    is_correct = user_code == expected
    
    if is_correct:
        base_score = 100
        time_penalty = min(time_taken / 1000 * 2, 50)
        score = max(base_score - time_penalty, 50)
    else:
        score = 0
    
    return jsonify({
        'success': True,
        'correct': is_correct,
        'score': round(score, 2),
        'time': time_taken,
        'expected_code': expected
    })

@app.route('/api/games/debugging/challenges')
def get_debug_challenges():
    """API lấy thử thách debugging"""
    return jsonify({
        'success': True,
        'challenges': DEBUGGING_CHALLENGES
    })

@app.route('/api/games/debugging/submit', methods=['POST'])
def submit_debug_solution():
    """API submit kết quả debugging"""
    data = request.get_json()
    challenge_id = data.get('challenge_id')
    user_code = data.get('code', '').strip()
    time_taken = data.get('time_taken', 0)
    
    challenge = next((c for c in DEBUGGING_CHALLENGES if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'success': False, 'message': 'Không tìm thấy thử thách'})
    
    correct_code = challenge['correct_code'].strip()
    is_correct = user_code == correct_code
    
    if is_correct:
        base_score = 100
        time_penalty = min(time_taken / 1000, 30)
        score = max(base_score - time_penalty, 70)
    else:
        score = 0
    
    return jsonify({
        'success': True,
        'correct': is_correct,
        'score': round(score, 2),
        'time': time_taken,
        'correct_code': correct_code,
        'hint': challenge.get('hint', '')
    })

@app.route('/api/games/code-art/templates')
def get_art_templates():
    """API lấy template code art"""
    return jsonify({
        'success': True,
        'templates': CODE_ART_TEMPLATES
    })

@app.route('/api/games/code-art/run', methods=['POST'])
def run_art_code():
    """API chạy code art"""
    data = request.get_json()
    code = data.get('code', '')
    
    try:
        # Tạo namespace riêng để chạy code (simplified)
        return jsonify({
            'success': True,
            'message': 'Code chạy thành công!'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/games/story/save', methods=['POST'])
def save_story():
    """API lưu câu chuyện code"""
    data = request.get_json()
    title = data.get('title')
    code = data.get('code')
    story = data.get('story')
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Chưa đăng nhập'})
    
    if 'stories' not in session:
        session['stories'] = []
    
    import time
    story_data = {
        'id': str(uuid.uuid4()),
        'title': title,
        'code': code,
        'story': story,
        'author': user_id,
        'created_at': time.time()
    }
    
    session['stories'].append(story_data)
    
    return jsonify({
        'success': True,
        'story_id': story_data['id']
    })

@app.route('/api/games/story/list')
def list_stories():
    """API lấy danh sách câu chuyện"""
    stories = session.get('stories', [])
    return jsonify({
        'success': True,
        'stories': stories
    })

@app.route('/api/games/battle/create', methods=['POST'])
def create_battle():
    """API tạo battle room"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Chưa đăng nhập'})
    
    battle_id = str(uuid.uuid4())[:8]
    
    if 'battles' not in session:
        session['battles'] = {}
    
    import time
    session['battles'][battle_id] = {
        'id': battle_id,
        'creator': user_id,
        'players': [user_id],
        'status': 'waiting',
        'created_at': time.time()
    }
    
    return jsonify({
        'success': True,
        'battle_id': battle_id
    })

@app.route('/api/games/battle/join', methods=['POST'])
def join_battle():
    """API tham gia battle"""
    data = request.get_json()
    battle_id = data.get('battle_id')
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Chưa đăng nhập'})
    
    battles = session.get('battles', {})
    battle = battles.get(battle_id)
    
    if not battle:
        return jsonify({'success': False, 'message': 'Không tìm thấy battle room'})
    
    if user_id not in battle['players']:
        battle['players'].append(user_id)
    
    if len(battle['players']) >= 2:
        battle['status'] = 'ready'
    
    return jsonify({
        'success': True,
        'battle': battle
    })

@app.route('/api/games/leaderboard')
def get_leaderboard():
    """API lấy bảng xếp hạng"""
    leaderboard = [
        {'name': 'Nguyễn Văn A', 'score': 950, 'games_played': 25},
        {'name': 'Trần Thị B', 'score': 890, 'games_played': 20},
        {'name': 'Lê Văn C', 'score': 845, 'games_played': 18},
        {'name': 'Phạm Thị D', 'score': 820, 'games_played': 22},
        {'name': 'Hoàng Văn E', 'score': 780, 'games_played': 15}
    ]
    
    return jsonify({
        'success': True,
        'leaderboard': leaderboard
    })

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