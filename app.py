from flask import Flask, render_template, jsonify, request
import psycopg2
from flask_cors import CORS
from psycopg2.extras import RealDictCursor

app = Flask(__name__, static_url_path='/static', static_folder='static')
CORS(app)

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        dbname='library_db',
        user='postgres',
        password='3911',
        host='localhost',
        port='5432'
    )
    return conn

@app.route('/')
def home():
    return render_template('index.html')

# Get all books and their current status
@app.route('/api/books', methods=['GET'])
def get_books():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                b.id AS book_id,
                b.title AS book_title,
                a.name AS author_name,
                p.name AS publisher_name,
                g.name AS genre_name,
                br.borrow_date,
                br.return_date,
                c.name AS customer_name,
                br.state
            FROM book b
            JOIN author a ON b.authorid = a.id
            JOIN publisher p ON b.publisherid = p.id
            JOIN genre g ON b.genreid = g.id
            LEFT JOIN borrowed br ON b.id = br.bookid AND br.return_date IS NULL
            LEFT JOIN customer c ON br.customerid = c.id
        ''')
        books = cursor.fetchall()
        cursor.close()
        conn.close()

        books = [
            {
                'book_id': book[0],
                'book_title': book[1],
                'author_name': book[2],
                'publisher_name': book[3],
                'genre_name': book[4],
                'borrow_date': book[5],
                'return_date': book[6],
                'customer_name': book[7],
                'state': book[8] if book[8] else 'Available'
            }
            for book in books
        ]

        return jsonify(books), 200
    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': 'Failed to fetch books, please try again later.'}), 500

# Borrow a book
@app.route('/api/borrow', methods=['POST'])
def borrow_book():
    try:
        data = request.json
        print("Received borrow request:", data)

        book_id = data.get('book_id')
        customer_name = data.get('customer_name')
        borrow_date = data.get('borrow_date')

        if not book_id or not customer_name or not borrow_date:
            return jsonify({'error': 'Missing data in request'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Check if the book exists and is available
        cursor.execute('''
            SELECT b.id, br.state
            FROM book b
            LEFT JOIN borrowed br ON b.id = br.bookid AND br.return_date IS NULL
            WHERE b.id = %s
        ''', (book_id,))
        result = cursor.fetchone()

        if not result:
            return jsonify({'error': 'Book not found'}), 404

        if result['state'] == 'Borrowed':
            return jsonify({'error': 'Book is already borrowed'}), 409

        # Check if customer exists
        cursor.execute('SELECT * FROM customer WHERE name = %s', (customer_name,))
        customer = cursor.fetchone()

        if not customer:
            cursor.execute(
                'INSERT INTO customer (name) VALUES (%s) RETURNING id',
                (customer_name,))
            customer_id = cursor.fetchone()['id']
        else:
            customer_id = customer['id']

        # Insert borrow record
        cursor.execute('''
            INSERT INTO borrowed (bookid, customerid, state, borrow_date)
            VALUES (%s, %s, 'Borrowed', %s)
        ''', (book_id, customer_id, borrow_date))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Book borrowed successfully!'}), 200

    except Exception as e:
        print(f"Exception during borrow: {e}")
        return jsonify({'error': 'Failed to borrow book, please try again later.'}), 500

# Return a book
@app.route('/api/return', methods=['POST'])
def return_book():
    try:
        data = request.json
        book_id = data.get('book_id')
        return_date = data.get('return_date')

        if not book_id or not return_date:
            return jsonify({'error': 'Missing data in request'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update borrowed record
        cursor.execute('''
            UPDATE borrowed
            SET return_date = %s, state = 'Returned'
            WHERE bookid = %s AND state = 'Borrowed' AND return_date IS NULL
        ''', (return_date, book_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Book returned successfully!'}), 200

    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': 'Failed to return book, please try again later.'}), 500

# Clear all borrowing records
@app.route('/api/clear', methods=['DELETE'])
def clear_all():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Clear borrowed table
        cursor.execute('TRUNCATE TABLE borrowed')

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'All records cleared successfully!'}), 200

    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({'error': 'Failed to clear records, please try again later.'}), 500

if __name__ == '__main__':
    app.run(debug=True)
