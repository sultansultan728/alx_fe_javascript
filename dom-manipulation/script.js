// ---------------------------
// Dynamic Quote Generator v4
// ---------------------------

// Load quotes from localStorage or defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { id: 2, text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { id: 3, text: "JavaScript is the language of the web.", category: "Programming" },
  { id: 4, text: "Simplicity is the soul of efficiency.", category: "Motivation" },
];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");
const addQuoteButton = document.getElementById("addQuoteButton");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");
const exportButton = document.getElementById("exportQuotesButton");
const importInput = document.getElementById("importFile");
const categoryFilter = document.getElementById("categoryFilter");
const syncButton = document.getElementById("syncButton");
const notificationBox = document.getElementById("notification");

// --------------------
// STORAGE HANDLERS
// --------------------
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function saveSelectedFilter(category) {
  localStorage.setItem("selectedCategory", category);
}

// --------------------
// NOTIFICATION HANDLER
// --------------------
function showNotification(message, timeout = 3000) {
  notificationBox.textContent = message;
  notificationBox.style.display = "block";
  setTimeout(() => {
    notificationBox.style.display = "none";
  }, timeout);
}

// --------------------
// CATEGORY MANAGEMENT
// --------------------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    categoryFilter.value = savedFilter;
  }
}

// --------------------
// FILTERING SYSTEM
// --------------------
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  saveSelectedFilter(selectedCategory);

  let filteredQuotes = quotes;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  quoteDisplay.innerHTML = "";
  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  filteredQuotes.forEach(q => {
    const quoteElem = document.createElement("p");
    quoteElem.textContent = `"${q.text}" — (${q.category})`;
    quoteDisplay.appendChild(quoteElem);
  });
}

// --------------------
// QUOTE FUNCTIONS
// --------------------
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  let filteredQuotes = quotes;

  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <p style="font-style:italic;color:#555;">— Category: ${quote.category}</p>
  `;

  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (text === "" || category === "") {
    alert("Please enter both a quote and a category.");
    return;
  }

  const newQuote = {
    id: Date.now(), // unique id
    text,
    category
  };

  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  filterQuotes();

  newQuoteText.value = "";
  newQuoteCategory.value = "";
  showNotification("Quote added successfully!");
}

// --------------------
// IMPORT / EXPORT JSON
// --------------------
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid JSON format.");

      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      filterQuotes();
      showNotification("Quotes imported successfully!");
    } catch (err) {
      alert("Error importing quotes: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// --------------------
// SERVER SYNC LOGIC
// --------------------

// Simulated fetch from mock API
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const serverData = await response.json();

    // Convert posts to quote-like objects
    const serverQuotes = serverData.map(item => ({
      id: item.id,
      text: item.title,
      category: "ServerSync"
    }));

    resolveConflicts(serverQuotes);
  } catch (error) {
    console.error("Error fetching server data:", error);
  }
}

// Conflict resolution (server wins)
function resolveConflicts(serverQuotes) {
  let conflictsResolved = 0;

  serverQuotes.forEach(serverQuote => {
    const localIndex = quotes.findIndex(q => q.id === serverQuote.id);
    if (localIndex === -1) {
      // New quote from server
      quotes.push(serverQuote);
    } else {
      // Conflict: Server version overwrites local
      quotes[localIndex] = serverQuote;
      conflictsResolved++;
    }
  });

  if (conflictsResolved > 0) {
    showNotification(`${conflictsResolved} conflicts resolved. Server data took precedence.`);
  } else {
    showNotification("Quotes synced with server successfully!");
  }

  saveQuotes();
  populateCategories();
  filterQuotes();
}

// Manual and automatic sync
function syncWithServer() {
  fetchQuotesFromServer();
}

// Auto-sync every 60 seconds
setInterval(syncWithServer, 60000);

// --------------------
// EVENT LISTENERS
// --------------------
newQuoteButton.addEventListener("click", showRandomQuote);
addQuoteButton.addEventListener("click", addQuote);
exportButton.addEventListener("click", exportToJsonFile);
importInput.addEventListener("change", importFromJsonFile);
syncButton.addEventListener("click", syncWithServer);
categoryFilter.addEventListener("change", filterQuotes);

// --------------------
// INITIALIZATION
// --------------------
populateCategories();
filterQuotes();

// Restore last viewed quote
const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  const quote = JSON.parse(lastQuote);
  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <p style="font-style:italic;color:#555;">— Category: ${quote.category}</p>
  `;
}

