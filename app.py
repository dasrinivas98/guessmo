from flask import Flask, render_template, request, jsonify
import datetime
import json
import os
import random

app = Flask(__name__)

WORDS_FILE = "words.json"
USED_FILE = "used_words.json"

# Load all words
with open(WORDS_FILE, "r") as f:
    WORDS = json.load(f)["words"]

# Load used words (if the file doesn’t exist, start empty)
if os.path.exists(USED_FILE):
    with open(USED_FILE, "r") as f:
        try:
            USED_WORDS = json.load(f)
        except json.JSONDecodeError:
            USED_WORDS = []
else:
    USED_WORDS = []


def get_daily_word():
    today = datetime.date.today().isoformat()

    # Check if today's word is already stored
    if os.path.exists(USED_FILE):
        with open(USED_FILE, "r") as f:
            try:
                used_data = json.load(f)
            except json.JSONDecodeError:
                used_data = {}

        if today in used_data:
            return used_data[today]

    # Pick a new word not used before
    available_words = [w for w in WORDS if w not in USED_WORDS]

    if not available_words:
        return "NONE"  # All words used up!

    chosen = random.choice(available_words)

    # Save this word as used for today
    USED_WORDS.append(chosen)
    used_data = {}
    if os.path.exists(USED_FILE):
        with open(USED_FILE, "r") as f:
            try:
                used_data = json.load(f)
            except json.JSONDecodeError:
                used_data = {}

    used_data[today] = chosen

    with open(USED_FILE, "w") as f:
        json.dump(used_data, f, indent=4)

    return chosen


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/check", methods=["POST"])
def check():
    data = request.get_json()
    guess = data["guess"].upper()
    secret = get_daily_word()

    result = []
    for i in range(4):
        if guess[i] == secret[i]:
            result.append("green")
        elif guess[i] in secret:
            result.append("yellow")
        else:
            result.append("gray")

    return jsonify({"result": result, "correct": guess == secret})


if __name__ == "__main__":
    app.run(debug=True)