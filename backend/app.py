# from flask import Flask, request, jsonify
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)

# @app.route("/signup", methods=["POST"])
# def signup():
#     data = request.get_json()
#     username = data.get("username")
#     password = data.get("password")

#     # Dummy response
#     return jsonify({"message": f"User {username} signed up successfully!"})

# @app.route("/login", methods=["POST"])
# def login():
#     data = request.get_json()
#     username = data.get("username")
#     password = data.get("password")
#     # Dummy check (replace with your real logic)
#     if username == "test" and password == "test":
#         return jsonify({"message": "Login successful!"})
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
from flask import send_from_directory
from datetime import timezone

app = Flask(__name__)
CORS(app)

# Config
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'database', 'mini_fb.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('MINIFB_SECRET', 'dev-secret-change-me')

db = SQLAlchemy(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete')
    posts = db.relationship('Post', backref='author', cascade='all, delete')

class Share(db.Model):
    __tablename__ = 'shares'
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    first_name = db.Column(db.String(100))
    surname = db.Column(db.String(100))
    bio = db.Column(db.Text)
    gender = db.Column(db.String(20))
    dob = db.Column(db.String(20))
    profile_pic_url = db.Column(db.String(500))
    cover_pic_url = db.Column(db.String(500))

class Post(db.Model):
    __tablename__ = 'posts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    media = db.relationship('PostMedia', backref='post', cascade='all, delete')

class PostMedia(db.Model):
    __tablename__ = 'post_media'
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False, index=True)
    media_type = db.Column(db.String(20), nullable=False)
    media_url = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Like(db.Model):
    __tablename__ = 'likes'
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FriendRequest(db.Model):
    __tablename__ = 'friend_requests'
    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Story(db.Model):
    __tablename__ = 'stories'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text)
    media_type = db.Column(db.String(20))  # 'image' or 'video'
    media_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))

    user = db.relationship('User', backref='stories')

# Initialize DB
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return "Flask server is running!"

############################
# Auth Helpers
############################
def create_token(user_id, email, username):
    payload = {
        'sub': str(user_id),
        'email': email,
        'username': username,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Missing or invalid token', 'detail': 'Authorization header must be: Bearer <token>'}), 401
        token = auth_header.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except Exception as e:
            # Provide error detail to help client debug quickly
            return jsonify({'message': 'Invalid or expired token', 'detail': str(e)}), 401
        request.user = payload
        return f(*args, **kwargs)
    return wrapper

############################
# Auth Routes
############################
@app.route('/api/auth/signup', methods=['POST'])
@app.route('/api/signup', methods=['POST'])  # alias for current frontend
def api_signup():
    data = request.get_json() or {}
    first = data.get('firstName')
    surname = data.get('surname')
    email = data.get('email')
    password = data.get('password')
    dob = data.get('dob')
    gender = data.get('gender')

    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400

    # Create a simple username from email prefix
    username = (email.split('@')[0] if email else '').lower()

    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({'message': 'User already exists'}), 400

    user = User(
        email=email,
        username=username,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.flush()

    prof = Profile(
        user_id=user.id,
        first_name=first,
        surname=surname,
        gender=gender,
        dob=dob
    )
    db.session.add(prof)
    db.session.commit()

    token = create_token(user.id, email, username)
    return jsonify({'message': 'Signup successful', 'token': token, 'username': username})

@app.route('/api/auth/login', methods=['POST'])
@app.route('/api/login', methods=['POST'])  # alias for current frontend
def api_login():
    data = request.get_json() or {}
    email = data.get('email') or data.get('username')  # support either field
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Email/Username and password required'}), 400

    user = User.query.filter((User.email == email) | (User.username == email)).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    token = create_token(user.id, user.email, user.username)
    return jsonify({'message': 'Login successful', 'token': token, 'username': user.username})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email') or data.get('username')  # support either field
    password = data.get('password')
    first_name = data.get('firstName', '')
    surname = data.get('surname', '')
    dob = data.get('dob')
    gender = data.get('gender')

    if not email or not password:
        return jsonify({'message': 'Email/Username and password required'}), 400

    # Check if user already exists
    existing = User.query.filter((User.email == email) | (User.username == email)).first()
    if existing:
        return jsonify({'message': 'User already exists'}), 409

    # Generate username if email is provided
    username = email if '@' not in email else email.split('@')[0]

    # Hash password
    password_hash = generate_password_hash(password)

    # Create user
    user = User(
        username=username,
        email=email,
        password_hash=password_hash
    )
    db.session.add(user)
    db.session.flush()  # Get the user ID

    # Create profile if additional data provided
    if first_name or surname or dob or gender:
        profile = Profile(
            user_id=user.id,
            first_name=first_name,
            surname=surname,
            dob=dob,
            gender=gender
        )
        db.session.add(profile)

    db.session.commit()

    # Return success response
    return jsonify({
        'message': 'User created successfully',
        'username': username,
        'email': email
    })

# Debug endpoint to inspect token issues
@app.route('/api/auth/debug', methods=['GET'])
def auth_debug():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'message': 'No Bearer token provided'}), 400
    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({'ok': True, 'payload': payload})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 401

############################
# Profile Routes
############################
@app.route('/api/profile/<username>', methods=['GET'])
def get_profile(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    prof = user.profile
    # Minimal posts count for profile header
    posts_count = Post.query.filter_by(user_id=user.id).count()
    return jsonify({
        'username': user.username,
        'name': f"{(prof.first_name or '').strip()} {(prof.surname or '').strip()}".strip() or user.username,
        'bio': prof.bio if prof else None,
        'gender': prof.gender if prof else None,
        'dob': prof.dob if prof else None,
        'friendsCount': 0,
        'profilePicUrl': prof.profile_pic_url if prof else None,
        'coverPicUrl': prof.cover_pic_url if prof else None,
        'postsCount': posts_count
    })

@app.route('/api/users/search', methods=['GET'])
def search_users():
    q = (request.args.get('q') or '').strip()
    if not q:
        return jsonify({'users': []})
    # Simple LIKE search; for sqlite use case-insensitive LIKE
    pattern = f"%{q}%"
    users = User.query.filter((User.username.ilike(pattern)) | (User.email.ilike(pattern))).limit(10).all()
    results = []
    for u in users:
        results.append({
            'username': u.username,
            'email': u.email
        })
    return jsonify({'users': results})

############################
# Posts Routes
############################
@app.route('/api/posts', methods=['GET'])
def list_posts():
    # Try to detect current user (optional)
    current_user_id = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            # sub stored as string
            current_user_id = int(payload.get('sub'))
        except Exception:
            current_user_id = None
    # Pagination params
    try:
        page = int(request.args.get('page', 1))
    except Exception:
        page = 1
    try:
        limit = int(request.args.get('limit', 10))
    except Exception:
        limit = 10
    if page < 1:
        page = 1
    if limit < 1 or limit > 50:
        limit = 10

    base_q = Post.query.order_by(Post.created_at.desc())
    total = base_q.count()
    offset = (page - 1) * limit
    posts = base_q.offset(offset).limit(limit).all()
    resp = []
    for p in posts:
        likes_count = Like.query.filter_by(post_id=p.id).count()
        comments_count = Comment.query.filter_by(post_id=p.id).count()
        shares_count = Share.query.filter_by(post_id=p.id).count()
        liked_by_me = False
        if current_user_id is not None:
            liked_by_me = Like.query.filter_by(post_id=p.id, user_id=current_user_id).first() is not None
        resp.append({
            'id': p.id,
            'content': p.content,
            'created_at': p.created_at.isoformat(),
            'username': p.author.username,
            'email': p.author.email,
            'likes': likes_count,
            'comments': comments_count,
            'shares': shares_count,
            'likedByMe': liked_by_me,
            'media': [{'type': m.media_type, 'url': m.media_url} for m in p.media]
        })
    has_more = (offset + len(resp)) < total
    return jsonify({'posts': resp, 'page': page, 'limit': limit, 'hasMore': has_more})

############################
# Friends & Notifications
############################

def _get_current_user():
    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    return user

@app.route('/api/friends/request', methods=['POST'])
@auth_required
def send_friend_request():
    data = request.get_json() or {}
    to_username = (data.get('to') or '').strip().lower()
    if not to_username:
        return jsonify({'message': 'Missing target user'}), 400
    me = _get_current_user()
    if not me:
        return jsonify({'message': 'User not found'}), 404
    if me.username == to_username:
        return jsonify({'message': 'Cannot friend yourself'}), 400
    other = User.query.filter_by(username=to_username).first()
    if not other:
        return jsonify({'message': 'Target not found'}), 404
    # If they already sent me a request pending, accept it
    incoming = FriendRequest.query.filter_by(from_user_id=other.id, to_user_id=me.id, status='pending').first()
    if incoming:
        incoming.status = 'accepted'
        db.session.commit()
        return jsonify({'message': 'Friend request accepted', 'status': 'friends'})
    # If I already sent one and it's pending, just return
    existing = FriendRequest.query.filter_by(from_user_id=me.id, to_user_id=other.id).first()
    if existing:
        return jsonify({'message': 'Request already sent', 'status': existing.status})
    # If we are already friends (any accepted request either direction)
    accepted = FriendRequest.query.filter(
        ((FriendRequest.from_user_id == me.id) & (FriendRequest.to_user_id == other.id) & (FriendRequest.status == 'accepted')) |
        ((FriendRequest.from_user_id == other.id) & (FriendRequest.to_user_id == me.id) & (FriendRequest.status == 'accepted'))
    ).first()
    if accepted:
        return jsonify({'message': 'Already friends', 'status': 'friends'})
    fr = FriendRequest(from_user_id=me.id, to_user_id=other.id, status='pending')
    db.session.add(fr)
    db.session.commit()
    return jsonify({'message': 'Friend request sent', 'status': 'pending'})

@app.route('/api/friends/accept', methods=['POST'])
@auth_required
def accept_friend_request():
    data = request.get_json() or {}
    from_username = (data.get('from') or '').strip().lower()
    if not from_username:
        return jsonify({'message': 'Missing from user'}), 400
    me = _get_current_user()
    if not me:
        return jsonify({'message': 'User not found'}), 404
    other = User.query.filter_by(username=from_username).first()
    if not other:
        return jsonify({'message': 'User not found'}), 404
    fr = FriendRequest.query.filter_by(from_user_id=other.id, to_user_id=me.id, status='pending').first()
    if not fr:
        return jsonify({'message': 'No pending request'}), 404
    fr.status = 'accepted'
    db.session.commit()
    return jsonify({'message': 'Friend request accepted', 'status': 'friends'})

@app.route('/api/friends/pending', methods=['GET'])
@auth_required
def list_pending_requests():
    me = _get_current_user()
    if not me:
        return jsonify({'message': 'User not found'}), 404
    reqs = FriendRequest.query.filter_by(to_user_id=me.id, status='pending').order_by(FriendRequest.created_at.desc()).all()
    users = []
    for r in reqs:
        u = User.query.get(r.from_user_id)
        if u:
            users.append({'username': u.username, 'email': u.email})
    return jsonify({'pending': users})

@app.route('/api/friends/status', methods=['GET'])
@auth_required
def friend_status():
    target = (request.args.get('user') or '').strip().lower()
    me = _get_current_user()
    if not me:
        return jsonify({'status': 'none'})
    if not target or target == me.username:
        return jsonify({'status': 'self'})
    other = User.query.filter_by(username=target).first()
    if not other:
        return jsonify({'status': 'none'})
    # accepted either direction
    accepted = FriendRequest.query.filter(
        ((FriendRequest.from_user_id == me.id) & (FriendRequest.to_user_id == other.id) & (FriendRequest.status == 'accepted')) |
        ((FriendRequest.from_user_id == other.id) & (FriendRequest.to_user_id == me.id) & (FriendRequest.status == 'accepted'))
    ).first()
    if accepted:
        return jsonify({'status': 'friends'})
    outgoing = FriendRequest.query.filter_by(from_user_id=me.id, to_user_id=other.id, status='pending').first()
    if outgoing:
        return jsonify({'status': 'pending_outgoing'})
    incoming = FriendRequest.query.filter_by(from_user_id=other.id, to_user_id=me.id, status='pending').first()
    if incoming:
        return jsonify({'status': 'pending_incoming'})
    return jsonify({'status': 'none'})

@app.route('/api/notifications/summary', methods=['GET'])
@auth_required
def notifications_summary():
    me = _get_current_user()
    if not me:
        return jsonify({'pendingFriendRequests': 0, 'newLikes': 0, 'newComments': 0})
    since_raw = request.args.get('since')
    try:
        since = datetime.fromisoformat(since_raw.replace('Z', '+00:00')) if since_raw else None
    except Exception:
        since = None
    # pending friend requests to me
    pending_count = FriendRequest.query.filter_by(to_user_id=me.id, status='pending').count()
    # likes/comments on my posts since time
    new_likes = 0
    new_comments = 0
    if since is not None:
        my_posts = Post.query.with_entities(Post.id).filter_by(user_id=me.id).subquery()
        new_likes = Like.query.filter(Like.post_id.in_(my_posts), Like.created_at > since).count()
        new_comments = Comment.query.filter(Comment.post_id.in_(my_posts), Comment.created_at > since).count()
    return jsonify({'pendingFriendRequests': pending_count, 'newLikes': new_likes, 'newComments': new_comments})

@app.route('/api/users/<username>/posts', methods=['GET'])
def list_user_posts(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    # Optional current user detection for likedByMe
    current_user_id = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = int(payload.get('sub'))
        except Exception:
            current_user_id = None
    # Pagination params
    try:
        page = int(request.args.get('page', 1))
    except Exception:
        page = 1
    try:
        limit = int(request.args.get('limit', 10))
    except Exception:
        limit = 10
    if page < 1:
        page = 1
    if limit < 1 or limit > 50:
        limit = 10

    base_q = Post.query.filter_by(user_id=user.id).order_by(Post.created_at.desc())
    total = base_q.count()
    offset = (page - 1) * limit
    posts = base_q.offset(offset).limit(limit).all()
    resp = []
    for p in posts:
        likes_count = Like.query.filter_by(post_id=p.id).count()
        comments_count = Comment.query.filter_by(post_id=p.id).count()
        shares_count = Share.query.filter_by(post_id=p.id).count()
        liked_by_me = False
        if current_user_id is not None:
            liked_by_me = Like.query.filter_by(post_id=p.id, user_id=current_user_id).first() is not None
        resp.append({
            'id': p.id,
            'content': p.content,
            'created_at': p.created_at.isoformat(),
            'username': user.username,
            'email': user.email,
            'likes': likes_count,
            'comments': comments_count,
            'shares': shares_count,
            'likedByMe': liked_by_me,
            'media': [{'type': m.media_type, 'url': m.media_url} for m in p.media]
        })
    has_more = (offset + len(resp)) < total
    return jsonify({'posts': resp, 'page': page, 'limit': limit, 'hasMore': has_more})

@app.route('/api/posts', methods=['POST'])
@auth_required
def create_post():
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    media_urls = data.get('media', [])

    if not content and not media_urls:
        return jsonify({'message': 'Content or media is required'}), 400

    # request.user['username'] is available; find user
    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    post = Post(user_id=user.id, content=content)
    db.session.add(post)
    db.session.flush()  # Get the post ID

    # Add media if provided
    for media_url in media_urls:
        if media_url.get('url'):
            media = PostMedia(
                post_id=post.id,
                media_type=media_url.get('type', 'image'),
                media_url=media_url['url'],
                file_name=media_url.get('filename', ''),
                file_size=media_url.get('size', 0)
            )
            db.session.add(media)

    db.session.commit()

    # Get updated counts
    likes_count = Like.query.filter_by(post_id=post.id).count()
    comments_count = Comment.query.filter_by(post_id=post.id).count()

    return jsonify({'message': 'Post created', 'post': {
        'id': post.id,
        'content': post.content,
        'created_at': post.created_at.isoformat(),
        'username': user.username,
        'email': user.email,
        'likes': likes_count,
        'comments': comments_count,
        'media': [{'type': m.media_type, 'url': m.media_url} for m in post.media]
    }})

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@auth_required
def toggle_like(post_id):
    # Find current user
    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    existing = Like.query.filter_by(post_id=post_id, user_id=user.id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        action = 'unliked'
        liked = False
    else:
        like = Like(post_id=post_id, user_id=user.id)
        db.session.add(like)
        db.session.commit()
        action = 'liked'
        liked = True
    likes_count = Like.query.filter_by(post_id=post_id).count()
    return jsonify({'message': f'Post {action}', 'likes': likes_count, 'liked': liked})

@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def list_comments(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()
    return jsonify({'comments': [
        {
            'id': c.id,
            'content': c.content,
            'created_at': c.created_at.isoformat(),
            'username': User.query.get(c.user_id).username
        } for c in comments
    ]})

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@auth_required
def add_comment(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'message': 'Content is required'}), 400
    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    c = Comment(post_id=post_id, user_id=user.id, content=content)
    db.session.add(c)
    db.session.commit()
    comments_count = Comment.query.filter_by(post_id=post_id).count()
    return jsonify({'message': 'Comment added', 'comment': {
        'id': c.id,
        'content': c.content,
        'created_at': c.created_at.isoformat(),
        'username': user.username
    }, 'comments': comments_count})

@app.route('/api/posts/<int:post_id>/share', methods=['POST'])
@auth_required
def share_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    # prevent duplicate shares by same user
    existing = Share.query.filter_by(post_id=post_id, user_id=user.id).first()
    if not existing:
        s = Share(post_id=post_id, user_id=user.id)
        db.session.add(s)
        db.session.commit()
    shares_count = Share.query.filter_by(post_id=post_id).count()
    return jsonify({'message': 'Post shared', 'shares': shares_count, 'shared': True})

@app.route('/api/posts/<int:post_id>', methods=['PUT'])
@auth_required
def update_post(post_id):
    # Ensure post exists and current user is the author
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if post.user_id != user.id:
        return jsonify({'message': 'Forbidden'}), 403

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()

    if not content:
        return jsonify({'message': 'Content is required'}), 400

    post.content = content

    # Update media if provided
    if 'media' in data:
        # Remove existing media
        PostMedia.query.filter_by(post_id=post_id).delete()

        # Add new media
        for media_url in data.get('media', []):
            if media_url.get('url'):
                media = PostMedia(
                    post_id=post.id,
                    media_type=media_url.get('type', 'image'),
                    media_url=media_url['url'],
                    file_name=media_url.get('filename', ''),
                    file_size=media_url.get('size', 0)
                )
                db.session.add(media)

    db.session.commit()

    likes_count = Like.query.filter_by(post_id=post.id).count()
    comments_count = Comment.query.filter_by(post_id=post.id).count()

    return jsonify({'message': 'Post updated', 'post': {
        'id': post.id,
        'content': post.content,
        'created_at': post.created_at.isoformat(),
        'username': user.username,
        'email': user.email,
        'likes': likes_count,
        'comments': comments_count,
        'media': [{'type': m.media_type, 'url': m.media_url} for m in post.media]
    }})

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@auth_required
def delete_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'message': 'Post not found'}), 404
    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if post.user_id != user.id:
        return jsonify({'message': 'Forbidden'}), 403
    # cascade delete comments and likes for this post
    Comment.query.filter_by(post_id=post.id).delete()
    Like.query.filter_by(post_id=post.id).delete()
    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted', 'ok': True})

############################
# Media Upload Routes
############################

# Configure upload folder
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'webm', 'ogg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
@auth_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to avoid conflicts
        timestamp = str(int(datetime.utcnow().timestamp()))
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{timestamp}{ext}"

        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Determine media type
        media_type = 'video' if ext.lower() in ['.mp4', '.webm', '.ogg'] else 'image'

        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'media_type': media_type,
            'url': f'/api/uploads/{filename}'
        })

    return jsonify({'message': 'File type not allowed'}), 400

@app.route('/api/stories', methods=['POST'])
@auth_required
def create_story():
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    media_url = data.get('media_url')
    media_type = data.get('media_type', 'image')

    if not content and not media_url:
        return jsonify({'message': 'Content or media is required'}), 400

    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Check if user already has an active story (optional - allow multiple stories)
    story = Story(
        user_id=user.id,
        content=content,
        media_type=media_type,
        media_url=media_url
    )
    db.session.add(story)
    db.session.commit()

    return jsonify({'message': 'Story created', 'story': {
        'id': story.id,
        'content': story.content,
        'media_type': story.media_type,
        'media_url': story.media_url,
        'created_at': story.created_at.isoformat(),
        'expires_at': story.expires_at.isoformat(),
        'username': user.username
    }})

@app.route('/api/stories', methods=['GET'])
def get_stories():
    # Get current user for personalization
    current_user_id = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = int(payload.get('sub'))
        except Exception:
            current_user_id = None

    # Get active stories (not expired)
    now = datetime.utcnow()
    active_stories = Story.query.filter(Story.expires_at > now).order_by(Story.created_at.desc()).limit(20).all()

    stories_data = []
    for story in active_stories:
        stories_data.append({
            'id': story.id,
            'content': story.content,
            'media_type': story.media_type,
            'media_url': story.media_url,
            'created_at': story.created_at.isoformat(),
            'expires_at': story.expires_at.isoformat(),
            'username': story.user.username,
            'user_id': story.user_id
        })

    return jsonify({'stories': stories_data})

@app.route('/api/stories/<int:story_id>', methods=['DELETE'])
@auth_required
def delete_story(story_id):
    story = Story.query.get(story_id)
    if not story:
        return jsonify({'message': 'Story not found'}), 404

    username = request.user.get('username')
    user = User.query.filter_by(username=username).first()
    if not user or story.user_id != user.id:
        return jsonify({'message': 'Forbidden'}), 403

    db.session.delete(story)
    db.session.commit()

    return jsonify({'message': 'Story deleted'})

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(
        os.path.join(app.root_path, 'static'),
        'favicon.ico',
        mimetype='image/vnd.microsoft.icon'
    )

if __name__ == "__main__":
    app.run(port=5000, debug=True)