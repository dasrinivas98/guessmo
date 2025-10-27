const grid = document.getElementById("grid");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submit");
const modeToggleBtn = document.getElementById("mode-toggle");
// Rules elements
const rulesBtn = document.getElementById("rules-btn");
const rulesModal = document.getElementById("rules-modal");
const closeBtn = document.querySelector(".close-btn");

let currentRow = 0;
const maxAttempts = 8;

// --- Mode Toggle Logic ---

/**
 * Sets the theme class on the body and updates the button icon.
 * @param {boolean} isLight - If true, applies light mode; otherwise applies dark mode.
 */
function setTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-mode');
        modeToggleBtn.textContent = '🌙'; 
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        modeToggleBtn.textContent = '💡'; 
        localStorage.setItem('theme', 'dark');
    }
}

// Apply saved preference on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    setTheme(true);
} else {
    setTheme(false); 
}

// Toggle handler
modeToggleBtn.addEventListener('click', () => {
    const isCurrentlyLight = document.body.classList.contains('light-mode');
    setTheme(!isCurrentlyLight);
});

// --- Rules Modal Logic ---

rulesBtn.addEventListener('click', () => {
    rulesModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    rulesModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === rulesModal) {
        rulesModal.style.display = 'none';
    }
});

// --- Grid Creation ---

// Create 8 rows × 4 cells
for (let i = 0; i < maxAttempts; i++) {
  const row = document.createElement("div");
  row.classList.add("row");

  for (let j = 0; j < 4; j++) {
    const cell = document.createElement("input");
    cell.type = "text";
    cell.maxLength = 1;
    cell.classList.add("cell");
    cell.dataset.row = i;
    cell.dataset.col = j;
    
    // Disable all rows except the first one (i = 0)
    if (i > currentRow) {
        cell.disabled = true;
    }

    row.appendChild(cell);
  }

  grid.appendChild(row);
}

const rows = document.querySelectorAll(".row");
let cells = rows[currentRow].querySelectorAll(".cell");

cells[0].focus();

// Helper function to display the temporary pop-up message
function showMessage(text) {
  message.textContent = text;
  message.classList.add("show");

  setTimeout(() => {
    message.classList.remove("show");
  }, 3000); 
}

// Move focus automatically on input
grid.addEventListener("input", (e) => {
  const cell = e.target;
  if (!cell.disabled && cell.value && cell.nextElementSibling) {
    cell.nextElementSibling.focus();
  }
});

// Handle backspace navigation
grid.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && !e.target.value) {
    const prev = e.target.previousElementSibling;
    if (prev) prev.focus();
  }
});

// --- Submission Logic ---

async function submitGuess() {
  const currentCells = rows[currentRow].querySelectorAll(".cell");
  const guess = Array.from(currentCells)
    .map((c) => c.value.toUpperCase())
    .join("");

  message.classList.remove("show");

  if (guess.length < 4) {
    showMessage("Enter all 4 letters!");
    return;
  }
  
  // Basic client-side check for unique letters (as per rules)
  if (new Set(guess.split('')).size !== 4) {
      showMessage("Letters must be unique!");
      return;
  }

  // 1. Disable current row's inputs immediately upon submission
  currentCells.forEach(c => c.disabled = true);
  submitBtn.disabled = true;

  try {
    const res = await fetch("/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess }),
    });

    const data = await res.json();

    if (res.status !== 200) {
      showMessage(data.error);
      // Re-enable current row if there was a server error (e.g., word not in dictionary)
      currentCells.forEach(c => c.disabled = false); 
      submitBtn.disabled = false;
      return;
    }

    // Apply color results
    for (let i = 0; i < 4; i++) {
      currentCells[i].classList.add(data.result[i]);
    }
    
    // The current row remains disabled after coloring.

    if (data.correct) {
      showMessage("🎉 You guessed it right!");
      submitBtn.disabled = true;
      return;
    }

    currentRow++;
    
    if (currentRow >= maxAttempts) {
      // Game over - final message stays on screen
      message.textContent = `❌ Out of attempts! The word was ${data.answer}`;
      message.classList.add("show");
      submitBtn.disabled = true;
      return;
    }

    // 2. Enable the NEXT row
    cells = rows[currentRow].querySelectorAll(".cell");
    cells.forEach(c => c.disabled = false); // Enable all cells in the new row
    
    // 3. Move focus and enable the button
    cells[0].focus();
    submitBtn.disabled = false;
    
  } catch (err) {
    showMessage("Server error!");
    // Re-enable current row if there was a server error
    currentCells.forEach(c => c.disabled = false);
    submitBtn.disabled = false;
  }
}

submitBtn.addEventListener("click", submitGuess);