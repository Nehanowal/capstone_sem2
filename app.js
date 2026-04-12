// INITIAL SETUP - Pehle se saved reels load karo ya empty array rakho 
let reels = JSON.parse(localStorage.getItem("reels")) || [];
let showOnlyFavorites = false;

//DOM ELEMENTS - HTML elements ko JS mein pakad rahe hain 

// Form wale elements
const reelForm = document.getElementById("reel-form");
const reelUrlInput = document.getElementById("reel-url");
const reelCategorySelect = document.getElementById("reel-category");
const reelNoteInput = document.getElementById("reel-note");
const submitBtn = document.getElementById("submit-btn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");

// Search aur filter wale elements
const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const sortOption = document.getElementById("sort-option");
const filterFavoritesBtn = document.getElementById("filter-favorites");

// UI elements
const reelsGrid = document.getElementById("reels-grid");
const emptyState = document.getElementById("empty-state");
const loadingIndicator = document.getElementById("loading-indicator");
const reelCount = document.getElementById("reel-count");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-icon");
const toast = document.getElementById("toast");

// Category ka naam dikhane ke liye mapping, key se readable nam milega
const categoryLabels = {
    study: "Study Material",
    food: "Food & Recipes",
    "self-improvement": "Self Improvement",
    fitness: "Fitness & Health",
    travel: "Travel",
    tech: "Tech & Coding",
    entertainment: "Entertainment",
    fashion: "Fashion & Beauty",
    other: "Other",
};

//THEME FUNCTIONS - Dark/Light mode ke liye 

// Page load hone par saved theme lagao
function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    // Dark mode mein sun icon, light mode mein moon icon dikhao
    themeIcon.textContent = savedTheme === "dark" ? "\u2600" : "\u263E";
}

// Theme toggle karo - dark se light, light se dark
function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    themeIcon.textContent = next === "dark" ? "\u2600" : "\u263E";
}

// HELPER FUNCTIONS 

// Reels ko localStorage mein save karo taaki page refresh par bhi rahe
function saveReels() {
    localStorage.setItem("reels", JSON.stringify(reels));
}

// Chhota sa notification message dikhao - 2.5 second baad apne aap gayab ho jaega
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
        setTimeout(function () {
            toast.classList.add("hidden");
        }, 300);
    }, 2500);
}

// HTML injection se bachne ke liye special characters ko escape karo
function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

//  API CALL - Instagram reel ka data (title, author, thumbnail) fetch karo 
function fetchReelData(url) {
    // noembed ek free API hai jo kisi bhi URL ka metadata de deta hai
    var apiUrl = "https://noembed.com/embed?url=" + encodeURIComponent(url);

    return fetch(apiUrl)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(function (data) {
            if (data.error) {
                throw new Error(data.error);
            }
            // Jo data mila usse ek clean object bana ke return karo
            return {
                title: data.title || "Untitled Reel",
                author: data.author_name || "Unknown",
                authorUrl: data.author_url || "",
                thumbnail: data.thumbnail_url || "",
                providerName: data.provider_name || "Instagram",
            };
        });
}

// ===== ADD REEL - Naya reel save karo =====
function handleAddReel(event) {
    // Form submit hone par page reload mat karo
    event.preventDefault();

    var url = reelUrlInput.value.trim();
    var category = reelCategorySelect.value;
    var note = reelNoteInput.value.trim();

    // Check karo ki URL Instagram ka hai ya nahi
    if (
        !url.includes("instagram.com/reel") &&
        !url.includes("instagram.com/p/")
    ) {
        showToast("Please enter a valid Instagram Reel URL");
        return;
    }

    // Duplicate check - yeh reel pehle se toh nahi save hai
    var duplicate = reels.find(function (reel) {
        return reel.url === url;
    });
    if (duplicate) {
        showToast("This reel is already saved!");
        return;
    }

    // Button par loading spinner dikhao
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    submitBtn.disabled = true;

    fetchReelData(url)
        .then(function (data) {
            // API se data mil gaya - poori details ke saath reel banao
            var newReel = {
                id: Date.now().toString(),
                url: url,
                category: category,
                note: note,
                title: data.title,
                author: data.author,
                authorUrl: data.authorUrl,
                thumbnail: data.thumbnail,
                favorite: false,
                addedAt: new Date().toISOString(),
            };

            reels.push(newReel);
            saveReels();
            reelForm.reset();
            renderReels();
            showToast("Reel added successfully!");
        })
        .catch(function () {
            // API fail ho gaya toh bhi basic info ke saath save kar do
            var newReel = {
                id: Date.now().toString(),
                url: url,
                category: category,
                note: note,
                title: "Instagram Reel",
                author: "Unknown",
                authorUrl: "",
                thumbnail: "",
                favorite: false,
                addedAt: new Date().toISOString(),
            };

            reels.push(newReel);
            saveReels();
            reelForm.reset();
            renderReels();
            showToast("Reel added (metadata unavailable)");
        })
        .finally(function () {
            // Chahe success ho ya fail, loading spinner hatao
            btnText.classList.remove("hidden");
            btnLoader.classList.add("hidden");
            submitBtn.disabled = false;
        });
}

// DELETE REEL - Reel ko list se hatao 
function deleteReel(id) {
    // filter se us id wali reel ko chhodke baaki sab rakho
    reels = reels.filter(function (reel) {
        return reel.id !== id;
    });
    saveReels();
    renderReels();
    showToast("Reel removed");
}

// TOGGLE Star lagao ya hatao
function toggleFavorite(id) {
    // map se us reel ka favorite true/false toggle karo
    reels = reels.map(function (reel) {
        if (reel.id === id) {
            return Object.assign({}, reel, { favorite: !reel.favorite });
        }
        return reel;
    });
    saveReels();
    renderReels();
}

// SEARCH, FILTER, SORT - Reels ko search/filter/sort karo
function getFilteredReels() {
    var searchTerm = searchInput.value.trim().toLowerCase();
    var categoryFilter = filterCategory.value;
    var sortBy = sortOption.value;

    // Step 1: Search - title, author ya note mein search term dhundho
    var result = reels.filter(function (reel) {
        if (searchTerm === "") return true;
        var titleMatch = reel.title.toLowerCase().includes(searchTerm);
        var authorMatch = reel.author.toLowerCase().includes(searchTerm);
        var noteMatch = reel.note
            ? reel.note.toLowerCase().includes(searchTerm)
            : false;
        return titleMatch || authorMatch || noteMatch;
    });

    // Step 2: Category filter - agar "all" nahi hai toh sirf us category ke reels dikhao
    if (categoryFilter !== "all") {
        result = result.filter(function (reel) {
            return reel.category === categoryFilter;
        });
    }

    // Step 3: Favorites filter - agar toggle on hai toh sirf favorite wale dikhao
    if (showOnlyFavorites) {
        result = result.filter(function (reel) {
            return reel.favorite === true;
        });
    }

    // Step 4: Sorting - user ne jo order choose kiya hai usse lagao
    result = result.sort(function (a, b) {
        if (sortBy === "newest") {
            return new Date(b.addedAt) - new Date(a.addedAt);
        }
        if (sortBy === "oldest") {
            return new Date(a.addedAt) - new Date(b.addedAt);
        }
        if (sortBy === "author-az") {
            return a.author.toLowerCase().localeCompare(b.author.toLowerCase());
        }
        if (sortBy === "author-za") {
            return b.author.toLowerCase().localeCompare(a.author.toLowerCase());
        }
        if (sortBy === "favorites") {
            // Pehle favorites, phir baaki newest order mein
            if (a.favorite === b.favorite) {
                return new Date(b.addedAt) - new Date(a.addedAt);
            }
            return a.favorite ? -1 : 1;
        }
        return 0;
    });

    return result;
}

// ===== REEL CARD BANANA - Ek reel ka card UI banao =====
function createReelCard(reel) {
    var card = document.createElement("div");
    card.className = "reel-card";

    // Date ko readable format mein convert karo (eg: "Apr 12, 2026")
    var dateObj = new Date(reel.addedAt);
    var formattedDate = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    // Thumbnail hai toh image dikhao, nahi toh placeholder icon
    var thumbnailHTML = reel.thumbnail
        ? '<img src="' + reel.thumbnail + '" alt="' + reel.title + '" class="card-thumbnail" onerror="this.outerHTML=\'<div class=card-thumbnail-placeholder>&#127910;</div>\'">'
        : '<div class="card-thumbnail-placeholder">&#127910;</div>';

    // Note hai toh dikhao, nahi toh kuch mat dikhao
    var noteHTML = reel.note
        ? '<p class="card-note">"' + escapeHTML(reel.note) + '"</p>'
        : "";

    // Card ka poora HTML set karo
    card.innerHTML =
        thumbnailHTML +
        '<div class="card-body">' +
        '<span class="card-category">' +
        escapeHTML(categoryLabels[reel.category] || reel.category) +
        "</span>" +
        '<h3 class="card-title">' +
        escapeHTML(reel.title) +
        "</h3>" +
        '<p class="card-author">by ' +
        escapeHTML(reel.author) +
        "</p>" +
        noteHTML +
        '<p class="card-date">Added on ' +
        formattedDate +
        "</p>" +
        "</div>" +
        '<div class="card-actions">' +
        '<button class="fav-btn ' +
        (reel.favorite ? "active" : "") +
        '" title="Toggle favorite">&#9733;</button>' +
        '<button class="delete-btn" title="Delete reel">&#128465;</button>' +
        '<a href="' +
        escapeHTML(reel.url) +
        '" target="_blank" rel="noopener noreferrer" class="open-link">Open Reel &rarr;</a>' +
        "</div>";

    // Star button par click kare toh favorite toggle ho
    var favBtn = card.querySelector(".fav-btn");
    favBtn.addEventListener("click", function () {
        toggleFavorite(reel.id);
    });

    // Delete button par click kare toh reel delete ho
    var deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
        deleteReel(reel.id);
    });

    return card;
}

// ===== RENDER - Saare reels ko screen par dikhao =====
function renderReels() {
    var filtered = getFilteredReels();

    // Pehle grid saaf karo
    reelsGrid.innerHTML = "";

    // Count update karo - kitne reels dikh rahe hain
    var total = reels.length;
    var showing = filtered.length;
    if (total === showing) {
        reelCount.textContent = total + " reel" + (total !== 1 ? "s" : "") + " saved";
    } else {
        reelCount.textContent =
            "Showing " + showing + " of " + total + " reels";
    }

    // Agar koi reel hi nahi hai toh empty state dikhao
    if (total === 0) {
        emptyState.classList.remove("hidden");
        reelsGrid.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    reelsGrid.classList.remove("hidden");

    // Agar filter ke baad koi result nahi aaya
    if (filtered.length === 0) {
        reelsGrid.innerHTML =
            '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">No reels match your search or filters.</p>';
        return;
    }

    // Har filtered reel ka card bana ke grid mein daal do
    filtered.forEach(function (reel) {
        var card = createReelCard(reel);
        reelsGrid.appendChild(card);
    });
}

// ===== DEBOUNCE - Search mein har key press par render mat karo, thoda ruko phir karo =====
function debounce(func, delay) {
    var timer;
    return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            func.apply(context, args);
        }, delay);
    };
}

//  EVENT LISTENERS - Buttons aur inputs par actions lagao

// Form submit hone par reel add karo
reelForm.addEventListener("submit", handleAddReel);

// Search input mein type kare toh 300ms baad render karo (debounce)
var debouncedRender = debounce(renderReels, 300);
searchInput.addEventListener("input", debouncedRender);

// Category filter ya sort change kare toh turant render karo
filterCategory.addEventListener("change", renderReels);
sortOption.addEventListener("change", renderReels);

// Favorites toggle button
filterFavoritesBtn.addEventListener("click", function () {
    showOnlyFavorites = !showOnlyFavorites;
    filterFavoritesBtn.classList.toggle("active", showOnlyFavorites);
    filterFavoritesBtn.textContent = showOnlyFavorites
        ? "Show All"
        : "Show Favorites";
    renderReels();
});

// Theme toggle button (dark/light mode)
themeToggle.addEventListener("click", toggleTheme);

//  APP START - Page load hone par theme lagao aur reels dikhao 
loadTheme();
renderReels();