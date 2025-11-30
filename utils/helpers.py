from functools import wraps
from flask import session, jsonify, request
from database.models import User, Session as UserSession

def login_required(f):
    """Decorator kiểm tra đăng nhập"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        session_token = session.get('session_token')
        
        if not user_id or not session_token:
            return jsonify({'success': False, 'message': 'Vui lòng đăng nhập'}), 401
        
        # Kiểm tra session
        user_session = UserSession.query.filter_by(
            user_id=user_id,
            session_token=session_token
        ).first()
        
        if not user_session or user_session.is_expired():
            session.clear()
            return jsonify({'success': False, 'message': 'Phiên làm việc đã hết hạn'}), 401
        
        # Kiểm tra user
        user = User.query.get(user_id)
        if not user or not user.is_active:
            session.clear()
            return jsonify({'success': False, 'message': 'Tài khoản không hợp lệ'}), 401
        
        # Thêm user vào request context
        request.current_user = user
        
        return f(*args, **kwargs)
    return decorated_function

def format_response(success=True, message='', data=None, status_code=200):
    """Format chuẩn cho API response"""
    response = {
        'success': success,
        'message': message
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code