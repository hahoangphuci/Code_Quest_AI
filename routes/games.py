from flask import Blueprint, render_template, request, jsonify, session
import json
import random
import time
import uuid

games_bp = Blueprint('games', __name__)

# Dữ liệu mẫu cho các game
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
    },
    {
        "id": 4,
        "question": "Độ phức tạp thời gian của thuật toán bubble sort là gì?",
        "options": ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
        "correct": 2,
        "difficulty": "hard"
    },
    {
        "id": 5,
        "question": "Method nào được sử dụng để thêm phần tử vào cuối list trong Python?",
        "options": ["add()", "append()", "insert()", "push()"],
        "correct": 1,
        "difficulty": "easy"
    },
    {
        "id": 6,
        "question": "Từ khóa nào dùng để bắt exception trong Python?",
        "options": ["catch", "except", "error", "handle"],
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
    },
    {
        "id": 3,
        "title": "Kiểm tra số chẵn",
        "description": "Viết function kiểm tra số chẵn",
        "expected_code": "def is_even(n):\n    return n % 2 == 0",
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
    },
    {
        "id": 3,
        "title": "Lỗi indentation",
        "buggy_code": "if True:\nprint('Hello')",
        "correct_code": "if True:\n    print('Hello')",
        "error_type": "indentation",
        "hint": "Python yêu cầu indentation đúng"
    }
]



# Routes cho các game
@games_bp.route('/games/code-battle')
def code_battle():
    """Trang Code Battle"""
    return render_template('games/code_battle.html')



@games_bp.route('/games/speed-coding')
def speed_coding():
    """Trang Speed Coding"""
    return render_template('games/speed_coding.html')

@games_bp.route('/games/code-quiz')
def code_quiz():
    """Trang Code Quiz"""
    return render_template('games/code_quiz.html')

@games_bp.route('/games/debugging-game')
def debugging_game():
    """Trang Debugging Game"""
    return render_template('games/debugging_game.html')

@games_bp.route('/games/code-story')
def code_story():
    """Trang Code Story"""
    return render_template('games/code_story.html')

# API endpoints cho Code Quiz
@games_bp.route('/api/games/quiz/questions')
def get_quiz_questions():
    """API lấy câu hỏi quiz"""
    difficulty = request.args.get('difficulty', 'all')
    count = int(request.args.get('count', 5))
    
    questions = QUIZ_QUESTIONS.copy()
    
    if difficulty != 'all':
        questions = [q for q in questions if q['difficulty'] == difficulty]
    
    # Trộn và lấy số lượng câu hỏi yêu cầu
    random.shuffle(questions)
    selected_questions = questions[:count]
    
    return jsonify({
        'success': True,
        'questions': selected_questions
    })

@games_bp.route('/api/games/quiz/submit', methods=['POST'])
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
        
        # Tìm câu hỏi tương ứng
        question = next((q for q in QUIZ_QUESTIONS if q['id'] == question_id), None)
        if question and question['correct'] == selected_option:
            correct_count += 1
    
    score = round((correct_count / total_questions) * 100, 2) if total_questions > 0 else 0
    
    # Lưu kết quả vào session hoặc database
    if 'quiz_scores' not in session:
        session['quiz_scores'] = []
    
    session['quiz_scores'].append({
        'score': score,
        'correct': correct_count,
        'total': total_questions,
        'time': time_taken,
        'date': time.time()
    })
    
    return jsonify({
        'success': True,
        'score': score,
        'correct': correct_count,
        'total': total_questions,
        'time': time_taken
    })

# API endpoints cho Speed Coding
@games_bp.route('/api/games/speed-coding/challenges')
def get_speed_challenges():
    """API lấy thử thách speed coding"""
    return jsonify({
        'success': True,
        'challenges': SPEED_CODING_CHALLENGES
    })

@games_bp.route('/api/games/speed-coding/submit', methods=['POST'])
def submit_speed_coding():
    """API submit kết quả speed coding"""
    data = request.get_json()
    challenge_id = data.get('challenge_id')
    user_code = data.get('code', '').strip()
    time_taken = data.get('time_taken', 0)
    
    # Tìm thử thách
    challenge = next((c for c in SPEED_CODING_CHALLENGES if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'success': False, 'message': 'Không tìm thấy thử thách'})
    
    # Kiểm tra code (đơn giản hóa)
    expected = challenge['expected_code'].strip()
    is_correct = user_code == expected
    
    # Tính điểm dựa trên độ chính xác và thời gian
    if is_correct:
        # Thời gian càng nhanh thì điểm càng cao
        base_score = 100
        time_penalty = min(time_taken / 1000 * 2, 50)  # Mỗi giây trừ 2 điểm, tối đa 50 điểm
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

# API endpoints cho Debugging Game
@games_bp.route('/api/games/debugging/challenges')
def get_debug_challenges():
    """API lấy thử thách debugging"""
    return jsonify({
        'success': True,
        'challenges': DEBUGGING_CHALLENGES
    })

@games_bp.route('/api/games/debugging/submit', methods=['POST'])
def submit_debug_solution():
    """API submit kết quả debugging"""
    data = request.get_json()
    challenge_id = data.get('challenge_id')
    user_code = data.get('code', '').strip()
    time_taken = data.get('time_taken', 0)
    
    # Tìm thử thách
    challenge = next((c for c in DEBUGGING_CHALLENGES if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'success': False, 'message': 'Không tìm thấy thử thách'})
    
    # Kiểm tra code đã sửa
    correct_code = challenge['correct_code'].strip()
    is_correct = user_code == correct_code
    
    # Tính điểm
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



# API endpoints cho Code Battle
@games_bp.route('/api/games/battle/create', methods=['POST'])
def create_battle():
    """API tạo battle room"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Chưa đăng nhập'})
    
    battle_id = str(uuid.uuid4())[:8]
    
    # Lưu thông tin battle (trong thực tế sẽ lưu database)
    if 'battles' not in session:
        session['battles'] = {}
    
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

@games_bp.route('/api/games/battle/join', methods=['POST'])
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

# API endpoints cho Code Story
@games_bp.route('/api/games/story/save', methods=['POST'])
def save_story():
    """API lưu câu chuyện code"""
    data = request.get_json()
    title = data.get('title')
    code = data.get('code')
    story = data.get('story')
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'Chưa đăng nhập'})
    
    # Lưu story (trong thực tế sẽ lưu database)
    if 'stories' not in session:
        session['stories'] = []
    
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

@games_bp.route('/api/games/story/list')
def list_stories():
    """API lấy danh sách câu chuyện"""
    stories = session.get('stories', [])
    return jsonify({
        'success': True,
        'stories': stories
    })

# API lấy leaderboard
@games_bp.route('/api/games/leaderboard')
def get_leaderboard():
    """API lấy bảng xếp hạng"""
    # Dữ liệu mẫu
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