from flask import Blueprint, request, jsonify, session
from database.models import db, User, Session as UserSession
from datetime import datetime, timedelta
import uuid
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Mật khẩu phải có ít nhất 8 ký tự"
    if not re.search(r'[A-Za-z]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ cái"
    if not re.search(r'\d', password):
        return False, "Mật khẩu phải chứa ít nhất 1 số"
    return True, "Mật khẩu hợp lệ"

@auth_bp.route('/register', methods=['POST'])
def register():
    """API đăng ký"""
    try:
        data = request.get_json()
        
        # Validate input
        full_name = data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not full_name:
            return jsonify({'success': False, 'message': 'Vui lòng nhập họ và tên'}), 400
            
        if not email or not validate_email(email):
            return jsonify({'success': False, 'message': 'Email không hợp lệ'}), 400
            
        if password != confirm_password:
            return jsonify({'success': False, 'message': 'Mật khẩu xác nhận không khớp'}), 400
            
        is_valid_password, password_message = validate_password(password)
        if not is_valid_password:
            return jsonify({'success': False, 'message': password_message}), 400
        
        # Kiểm tra email đã tồn tại
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Email này đã được sử dụng'}), 400
        
        # Tạo user mới
        new_user = User(
            full_name=full_name,
            email=email
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Register error: {e}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra, vui lòng thử lại'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """API đăng nhập"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        remember = data.get('remember', False)
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Vui lòng nhập đầy đủ thông tin'}), 400
        
        # Tìm user
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Email hoặc mật khẩu không chính xác'}), 401
        
        if not user.is_active:
            return jsonify({'success': False, 'message': 'Tài khoản đã bị khóa'}), 401
        
        # Tạo session
        session_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=30 if remember else 1)
        
        user_session = UserSession(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at
        )
        
        # Cập nhật last_login
        user.last_login = datetime.utcnow()
        
        db.session.add(user_session)
        db.session.commit()
        
        # Lưu session vào Flask session
        session['user_id'] = user.id
        session['session_token'] = session_token
        
        return jsonify({
            'success': True,
            'message': 'Đăng nhập thành công!',
            'user': user.to_dict(),
            'session_token': session_token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Login error: {e}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra, vui lòng thử lại'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """API đăng xuất"""
    try:
        session_token = session.get('session_token')
        
        if session_token:
            # Xóa session khỏi database
            user_session = UserSession.query.filter_by(session_token=session_token).first()
            if user_session:
                db.session.delete(user_session)
                db.session.commit()
        
        # Xóa Flask session
        session.clear()
        
        return jsonify({'success': True, 'message': 'Đăng xuất thành công'}), 200
        
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra'}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Lấy thông tin profile"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Chưa đăng nhập'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'Không tìm thấy user'}), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra'}), 500

@auth_bp.route('/check-session', methods=['GET'])
def check_session():
    """Kiểm tra session còn hợp lệ không"""
    try:
        user_id = session.get('user_id')
        session_token = session.get('session_token')
        
        if not user_id or not session_token:
            return jsonify({'success': False, 'authenticated': False}), 200
        
        # Kiểm tra session trong database
        user_session = UserSession.query.filter_by(
            user_id=user_id,
            session_token=session_token
        ).first()
        
        if not user_session or user_session.is_expired():
            session.clear()
            return jsonify({'success': False, 'authenticated': False}), 200
        
        user = User.query.get(user_id)
        if not user or not user.is_active:
            session.clear()
            return jsonify({'success': False, 'authenticated': False}), 200
        
        return jsonify({
            'success': True,
            'authenticated': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Check session error: {e}")
        return jsonify({'success': False, 'authenticated': False}), 200