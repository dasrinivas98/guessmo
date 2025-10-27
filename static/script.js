const board = document.getElementById("board");
const input = document.getElementById("guessInput");
const button = document.getElementById("submitBtn");
const message = document.getElementById("message");

let attempts = 0;
const maxAttempts = 8;

function createRow(letters, colors) {
  const row = document.createElement("div");
  row.classList.add("grid", "grid-cols-4", "gap-2", "justify-center");

  for (let i = 0; i < 4; i++) {
    const tile = document.createElement("div");
    tile.textContent = letters[i] || "";
    tile.classList.add("w-12", "h-12", "flex", "items-center", "justify-center", "text-2xl", "font-bold", "rounded");
    tile.classList.add(
      colors[i] === "green" ? "bg-green-500" :
      colors[i] === "yellow" ? "bg-yellow-400" :
      "bg-gray-600"
    );
    row.appendChild(tile);
  }
  board.appendChild(row);
}

button.addEventListener("click", async () => {
  const guess = input.value.trim().toUpperCase();
  if (guess.length !== 4 || !/^[A-Z]+$/.test(guess)) {
    message.textContent = "❌ Please enter a valid 4-letter word!";
    return;
  }

  if (attempts >= maxAttempts) {
    message.textContent = "😔 No more attempts left!";
    return;
  }

  const res = await fetch("/check", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ guess })
  });

  const data = await res.json();
  createRow(guess.split(""), data.result);
  attempts++;

  if (data.correct) {
    message.textContent = "🎉 You guessed it!";
    button.disabled = true;
    input.disabled = true;
  } else if (attempts >= maxAttempts) {
    message.textContent = "❌ Out of attempts! Try again tomorrow.";
  } else {
    message.textContent = "";
  }

  input.value = "";
});
