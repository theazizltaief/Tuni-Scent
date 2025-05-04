from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime
from flask import send_from_directory
import json
import os

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tuniscent.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ==================== MODELS ====================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mail = db.Column(db.String(80), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    profile_pic = db.Column(db.Text, nullable=True)

    collections = db.Column(db.JSON, nullable=True)
    favorites = db.relationship('Favorite', backref='user', lazy=True)
    cart_items = db.relationship('CartItem', backref='user', lazy=True)
    reviews = db.relationship('Review', back_populates='user', lazy=True)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    brand = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(200))
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    top_notes = db.Column(db.Text)  # store JSON string
    heart_notes = db.Column(db.Text)
    base_notes = db.Column(db.Text)

    reviews = db.relationship('Review', back_populates='product')



class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(250), nullable=False)  # Review content
    rating = db.Column(db.Integer, nullable=False)  # Rating for the review (e.g., 1-5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # Time when the review is created

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='reviews')
    product = db.relationship('Product', back_populates='reviews')

    def __init__(self, content, rating, user_id, product_id):
        self.content = content
        self.rating = rating
        self.user_id = user_id
        self.product_id = product_id

    def __repr__(self):
        return f'<Review {self.id} - User: {self.user_id}, Product: {self.product_id}>'


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))


class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))


# ==================== ROUTES ====================

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'User already exists'}), 400
    hashed = generate_password_hash(data['password'])
    user = User(mail=data['email'], username=data['username'], password_hash=hashed)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created', 'user_id': user.id})


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(mail=data['mail']).first()
    if user and user.check_password(data['password']):
        return jsonify({'message': 'Login successful', 'user_id': user.id})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/user/<int:user_id>', methods=['GET', 'PUT'])
def user_details(user_id):
    # Fetch the user from the database by user_id
    user = User.query.get_or_404(user_id)

    if request.method == 'GET':
        # Return the user details as JSON
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.mail,
            'bio': user.bio,
            'image': user.profile_pic,
            'collections': json.loads(user.collections) if user.collections else {},
            'favorites': [{'product_id': fav.product_id} for fav in user.favorites],
            'cart_items': [{'product_id': cart_item.product_id} for cart_item in user.cart_items],
        })

    elif request.method == 'PUT':
        # Update the user details with data from the request
        data = request.get_json()

        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.mail = data['email']
        if 'password' in data:
            user.password_hash = generate_password_hash(data['password'])
        if 'collections' in data:
            user.collections = json.dumps(data['collections'])

        # Commit the changes to the database
        db.session.commit()

        return jsonify({'message': 'User details updated successfully'}), 200

@app.route('/upload_profile_pic/<int:user_id>', methods=['POST'])
def upload_profile_pic(user_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    # Check if a file was selected
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Check if the file extension is allowed
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)  # Secure the filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save the file to the server
        file.save(filepath)

        # Retrieve the user by user_id
        user = User.query.get(user_id)

        if user:
            # Update the profile_pic field in the database with the new file path
            user.profile_pic = filepath
            db.session.commit()
            
            return jsonify({'message': 'Profile picture updated successfully', 'profile_pic': filepath})
        else:
            return jsonify({'error': 'User not found'}), 404

    return jsonify({'error': 'Invalid file format'}), 400

@app.route('/products', methods=['GET', 'POST'])
def products():
    if request.method == 'POST':
        data = request.get_json()
        product = Product(name=data['name'], brand=data['brand'], price=data['price'], description=data['description'])
        db.session.add(product)
        db.session.commit()
        return jsonify({'message': 'Product added'})
    else:
        products = Product.query.all()
        return jsonify([{'id': p.id, 'name': p.name, 'brand': p.brand, "image": p.image, "topNotes": json.loads(p.top_notes), "heartNotes": json.loads(p.heart_notes), "baseNotes": json.loads(p.base_notes)} for p in products])

@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    # Fetch the product from the database by its ID
    product = Product.query.get_or_404(product_id)

    # Return the product details in the response
    return jsonify({
        'id': product.id,
        'name': product.name,
        'brand': product.brand,
        'price': product.price,
        'image': product.image,
        'description': product.description,
        'topNotes': json.loads(product.top_notes),
        'heartNotes': json.loads(product.heart_notes),
        'baseNotes': json.loads(product.base_notes)
    })

@app.route('/cart/remove', methods=['DELETE'])
def remove_from_cart():
    data = request.get_json()

    # Fetch the cart item based on user_id and product_id
    item = CartItem.query.filter_by(user_id=data['user_id'], product_id=data['product_id']).first()

    # If the item exists, delete it
    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item removed from cart'}), 200
    else:
        return jsonify({'message': 'Item not found in cart'}), 404

@app.route('/reviews', methods=['GET'])
def get_reviews():
    # Query all reviews from the database, including related User and Product information
    reviews = Review.query.all()

    # Format the reviews into a JSON-compatible list
    review_list = []
    for review in reviews:
        review_list.append({
            "user": {
                "name": review.user.username,
                "image": review.user.profile_pic,
            },
            "product": {
                "name": review.product.name
            },
            "content": review.content,
            "rating": review.rating,  # Assuming you added a rating column in the Review model
            "created_at": review.created_at.isoformat()  # Convert datetime to string (ISO format)
        })

    # Return the list of reviews as JSON
    return jsonify(review_list)


@app.route('/reviews', methods=['POST'])
def add_review():
    data = request.get_json()

    # Assuming you have a function to look up product_id from the product name (perfume)
    product = Product.query.filter_by(name=data['perfume']).first()  # Adjust based on your actual data model
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    review = Review(
        content=data['text'],
        user_id=data['authorId'],
        product_id=product.id,
        rating=data['rating']  # Assuming you want to store the rating as well
    )

    db.session.add(review)
    db.session.commit()

    return jsonify({'message': 'Review added'})

@app.route('/reviews/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    reviews = Review.query.filter_by(user_id=user_id).all()

    review_list = []
    for review in reviews:
        review_list.append({
            "user": {
                "name": review.user.username,
                "image": review.user.profile_pic,
            },
            "product": {
                "name": review.product.name
            },
            "content": review.content,
            "rating": review.rating,
            "created_at": review.created_at.isoformat()
        })

    return jsonify(review_list)

@app.route('/collection/add', methods=['POST'])
def add_to_collection():
    """Add a fragrance to the user's collection."""
    data = request.get_json()

    # Extracting necessary information from the incoming data
    user_id = data.get('user_id')
    product_id = data.get('productId')
    brand = data.get('brand')
    fragrance_data = data.get('fragranceData')

    if not user_id or not product_id or not brand or not fragrance_data:
        return jsonify({'success': False, 'message': 'Missing required data'}), 400

    # Query the user by ID to get the collections
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    # Get the current user's collection (deserialize if exists)
    collections = json.loads(user.collections) if user.collections else {}

    # Check if the product already exists in the collection
    if product_id in collections:
        return jsonify({'success': False, 'message': 'Product already in collection'}), 400

    # Add fragrance to the collection
    print("before:", collections)
    collections[product_id] = fragrance_data
    print("after:", collections)

    # Update the user's collections field in the database
    user.collections = json.dumps(collections)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Fragrance added to your collection!'}), 200

@app.route('/collection/<int:user_id>', methods=['GET'])
def get_user_collection(user_id):
    """Fetch the user's collection."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Get the user's collection (deserialize if exists)
    collections = json.loads(user.collections) if user.collections else {}

    # Return the collection as a JSON response
    return jsonify(collections)

@app.route('/cart', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    item = CartItem(user_id=data['user_id'], product_id=data['product_id'])
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Added to cart'})


@app.route('/cart/<int:user_id>', methods=['GET'])
def get_cart(user_id):
    items = CartItem.query.filter_by(user_id=user_id).all()
    return jsonify([{'product_id': item.product_id} for item in items])

@app.route('/favorite', methods=['POST'])
def favorite():
    data = request.get_json()
    fav = Favorite(user_id=data['user_id'], product_id=data['product_id'])
    db.session.add(fav)
    db.session.commit()
    return jsonify({'message': 'Added to favorites'})

@app.route('/favorites/<int:user_id>', methods=['GET'])
def get_favorites(user_id):
    items = Favorite.query.filter_by(user_id=user_id).all()
    return jsonify([{'product_id': item.product_id} for item in items])


# ==================== INIT DB ====================

with app.app_context():
    db.create_all()

# Serve React / Angular / static frontend files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Go one folder up and then to 'frontend'
    base_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    frontend_folder = os.path.join(base_dir, 'frontend')
    
    if path != "" and os.path.exists(os.path.join(frontend_folder, path)):
        return send_from_directory(frontend_folder, path)
    else:
        return send_from_directory(frontend_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)