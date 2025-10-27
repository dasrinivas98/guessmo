from flask import Flask, render_template, request, jsonify
import datetime

app = Flask(__name__)

WORDS = ["MINT", "LAMP", "PARK", "DUCK", "COLD", "WAVE", "HAND", "FIRE", "SAND", "TREE"]

def get_daily_word():
    today = datetime.date.today()
    index = today.toordinal() % len(WORDS)
    return WORDS[index]

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
