from flask import Flask, render_template, request, jsonify
import datetime, json, random, os

app = Flask(__name__)

# Load all possible 4-letter daily words
with open("words.json") as f:
    WORDS = json.load(f)["words"]

# Load already used words (date → word)
if os.path.exists("used_words.json"):
    with open("used_words.json") as f:
        USED_WORDS = json.load(f)
else:
    USED_WORDS = {}

# Load valid English 4-letter words
with open("valid_words.json") as f:
    VALID_WORDS = set(json.load(f)["valid_words"])


def get_daily_word():
    today_str = str(datetime.date.today())

    # if already assigned, reuse the same daily word
    if today_str in USED_WORDS:
        return USED_WORDS[today_str]

    # pick a random word that hasn't been used before
    available_words = [w for w in WORDS if w not in USED_WORDS.values()]
    if not available_words:
        # reset if all words are used
        USED_WORDS.clear()
        available_words = WORDS

    secret = random.choice(available_words)
    USED_WORDS[today_str] = secret

    # save to used_words.json
    with open("used_words.json", "w") as f:
        json.dump(USED_WORDS, f, indent=4)

    return secret


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/check", methods=["POST"])
def check():
    data = request.get_json()
    guess = data["guess"].upper()

    # validate word
    if guess not in VALID_WORDS:
        return jsonify({"error": "Not a valid Word!"}), 400

    secret = get_daily_word()
    result = []
    for i in range(4):
        if guess[i] == secret[i]:
            result.append("green")
        elif guess[i] in secret:
            result.append("yellow")
        else:
            result.append("gray")

    return jsonify({"result": result, "correct": guess == secret, "answer": secret})


if __name__ == "__main__":
    app.run(debug=True)
