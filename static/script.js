const grid = document.getElementById("grid");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submit");
const modeToggleBtn = document.getElementById("mode-toggle");
const streakDisplay = document.getElementById("streak-display"); // NEW: Streak display element

// Rules elements
const rulesBtn = document.getElementById("rules-btn");
const rulesModal = document.getElementById("rules-modal");
const closeBtn = document.querySelector(".close-btn");

let currentRow = 0;
const maxAttempts = 8;
const wordLength = 4;

// --- Helper Functions for Streak/Daily Logic ---

/**
 * Gets today's date string in YYYY-MM-DD format (UTC) for consistent tracking.
 * @returns {string} The date string.
 */
function getTodayDateString() {
    // We use UTC to ensure the "day" boundary is consistent globally (e.g., 00:00 UTC)
    return new Date().toISOString().split('T')[0]; 
}

function displayStreak(count) {
    if (streakDisplay) {
        streakDisplay.textContent = `🔥 Streak: ${count}`;
    }
}

function disableAllInput() {
    document.querySelectorAll('.cell').forEach(c => c.disabled = true);
    submitBtn.disabled = true;
}

function enableCurrentRowInput() {
    const currentCells = rows[currentRow] ? rows[currentRow].querySelectorAll(".cell") : [];
    
    // Only proceed if the current row exists
    if (currentCells.length > 0) {
        currentCells.forEach(c => c.disabled = false); // Enable all cells in the new row
        submitBtn.disabled = false;
        currentCells[0].focus();
    }
}


// --- Game Initialization and Streak Check ---

function initializeGame() {
    const today = getTodayDateString();
    
    // Retrieve data
    let streak = parseInt(localStorage.getItem('currentStreak')) || 0;
    const lastPlayedDate = localStorage.getItem('lastPlayedDate');
    
    // Check if the user has completed the game for TODAY's date (stored in hasCompletedToday)
    const hasCompletedToday = localStorage.getItem('hasCompletedToday') === today;
    
    // --- Streak Check and Reset Logic ---
    if (lastPlayedDate !== today) {
        // A new day has started or the user hasn't played today.
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (lastPlayedDate && lastPlayedDate !== yesterdayString) {
            // Last played was NOT yesterday, so the streak is broken!
            streak = 0;
            localStorage.setItem('currentStreak', streak);
            showMessage(`Streak broken! New streak: 0`);
        }
        
        // Reset the 'played status' for the new day
        localStorage.setItem('hasCompletedToday', 'false'); 
    
    } else if (hasCompletedToday) {
        // User has already completed today's game (win or loss on this day)
        showMessage("You've already played today's GuessMo! Come back tomorrow.");
        disableAllInput(); 
        // Need logic here to display the final result of the previous game if you want.
        // For now, we just disable input.
    }
    
    displayStreak(streak);
    enableCurrentRowInput();
}


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

  for (let j = 0; j < wordLength; j++) {
    const cell = document.createElement("input");
    cell.type = "text";
    cell.maxLength = 1;
    cell.classList.add("cell");
    cell.dataset.row = i;
    cell.dataset.col = j;
    
    // Disable all cells initially. initializeGame() will enable the first row.
    cell.disabled = true;

    row.appendChild(cell);
  }

  grid.appendChild(row);
}

const rows = document.querySelectorAll(".row");

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
  } else if (e.key === "Enter") {
    // Allow Enter key submission
    submitGuess();
  }
});


// --- Submission Logic ---

async function submitGuess() {
  const currentCells = rows[currentRow].querySelectorAll(".cell");
  const guess = Array.from(currentCells)
    .map((c) => c.value.toUpperCase())
    .join("");

  message.classList.remove("show");

  if (guess.length < wordLength) {
    showMessage(`Enter all ${wordLength} letters!`);
    return;
  }
  
  // Basic client-side check for unique letters (as per rules)
  if (new Set(guess.split('')).size !== wordLength) {
      showMessage("Letters must be unique!");
      return;
  }

  // 1. Disable current row's inputs immediately upon submission
  disableAllInput(); // Disable all game input
  
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
      enableCurrentRowInput(); 
      return;
    }

    // Apply color results
    for (let i = 0; i < wordLength; i++) {
      currentCells[i].classList.add(data.result[i]);
    }
    
    // The current row remains disabled after coloring.

    if (data.correct) {
      showMessage("🎉 You guessed it right!");
      // *** WIN LOGIC: Update Streak and Mark as Completed ***
      let streak = parseInt(localStorage.getItem('currentStreak')) || 0;
      streak++;
      localStorage.setItem('currentStreak', streak);
      localStorage.setItem('lastPlayedDate', getTodayDateString());
      localStorage.setItem('hasCompletedToday', getTodayDateString()); // Mark completion with the current date
      displayStreak(streak);
      // *******************************************************
      return;
    }

    currentRow++;
    
    if (currentRow >= maxAttempts) {
      // Game over (Loss)
      
      // *** LOSS LOGIC: Reset Streak and Mark as Completed ***
      localStorage.setItem('currentStreak', 0); // Streak is reset on a loss
      localStorage.setItem('lastPlayedDate', getTodayDateString());
      localStorage.setItem('hasCompletedToday', getTodayDateString()); // Mark completion with the current date
      displayStreak(0);
      // *******************************************************
      
      // Game over - final message stays on screen
      message.textContent = `❌ Out of attempts! The word was ${data.answer}`;
      message.classList.add("show");
      return;
    }

    // 2. Enable the NEXT row
    enableCurrentRowInput();
    
  } catch (err) {
    console.error(err);
    showMessage("Server error! Could not connect.");
    // Re-enable current row if there was a server error
    enableCurrentRowInput();
  }
}

submitBtn.addEventListener("click", submitGuess);

// --- START THE GAME ---
initializeGame();