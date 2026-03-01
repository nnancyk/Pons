from flask import Flask, request, jsonify
from ai_search import ai_search
from models import get_all_events

app = Flask(__name__)

@app.route("/api/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data.get("query", "")
    if not query.strip():
        return jsonify([])
    events = ai_search(query)
    return jsonify(events)

@app.route("/api/events", methods=["GET"])
def events():
    return jsonify(get_all_events())

if __name__ == "__main__":
    app.run(debug=True, port=5001)
