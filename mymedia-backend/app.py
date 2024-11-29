from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os

app = Flask(__name__)
CORS(app)

# Database connection function
def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="mymedia",
        user="postgres",
        password="Ilikepie942mem!"  # Replace with your actual password
    )
    return conn

# Route to get all media entries
@app.route('/media', methods=['GET'])
def get_media():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM media;')
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Convert rows to list of dictionaries
    media_list = []
    for row in rows:
        media_item = {
            'id': row[0],
            'title': row[1],
            'score': row[2],
            'media_type': row[3],
            'status': row[4],
            'progress': row[5],
            'comment': row[6]
        }
        media_list.append(media_item)

    return jsonify(media_list)

# Route to add a new media entry
@app.route('/media', methods=['POST'])
def add_media():
    media = request.get_json()
    title = media.get('title')  # Required field
    score = media.get('score') or None  # Default to None if empty
    media_type = media.get('media_type')  # Required field
    status = media.get('status') or None  # Default to None if empty
    progress = media.get('progress') or None  # Default to None if empty
    comment = media.get('comment') or None  # Default to None if empty

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO media (title, score, media_type, status, progress, comment)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (title, score, media_type, status, progress, comment))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'id': new_id}), 201


# Route to update an existing media entry
@app.route('/media/<int:id>', methods=['PUT'])
def update_media(id):
    media = request.get_json()
    title = media.get('title')
    score = media.get('score')
    media_type = media.get('media_type')
    status = media.get('status')
    progress = media.get('progress')
    comment = media.get('comment')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE media
        SET title = %s, score = %s, media_type = %s, status = %s, progress = %s, comment = %s
        WHERE id = %s;
    """, (title, score, media_type, status, progress, comment, id))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'message': 'Media updated successfully'})

# Route to delete a media entry
@app.route('/media/<int:id>', methods=['DELETE'])
def delete_media(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM media WHERE id = %s;', (id,))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'message': 'Media deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True)
