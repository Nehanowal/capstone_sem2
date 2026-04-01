let reels = JSON.parse(localStorage.getItem("reels")) || [];
let showOnlyFavorites = false;

const reelForm = document.getElementById("reel-form");
const reelUrlInput = document.getElementById("reel-url");
const reelCategorySelect = document.getElementById("reel-category");
const reelNoteInput = document.getElementById("reel-note");
const submitBtn = document.getElementById("submit-btn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");

const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const sortOption = document.getElementById("sort-option");
const filterFavoritesBtn = document.getElementById("filter-favorites");

const reelsGrid = document.getElementById("reels-grid");
const emptyState = document.getElementById("empty-state");
const loadingIndicator = document.getElementById("loading-indicator");
const reelCount = document.getElementById("reel-count");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-icon");
const toast = document.getElementById("toast");
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

function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeIcon.textContent = savedTheme === "dark" ? "\u2600" : "\u263E";
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    themeIcon.textContent = next === "dark" ? "\u2600" : "\u263E";
}

function saveReels() {
    localStorage.setItem("reels", JSON.stringify(reels));
}

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

// ===== API: Fetch reel metadata from noembed =====
function fetchReelData(url) {
    var apiUrl =
        "https://noembed.com/embed?url=" + encodeURIComponent(url);

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
            return {
                title: data.title || "Untitled Reel",
                author: data.author_name || "Unknown",
                authorUrl: data.author_url || "",
                thumbnail: data.thumbnail_url || "",
                providerName: data.provider_name || "Instagram",
            };
        });
}

// ===== ADD REEL =====
function handleAddReel(event) {
    event.preventDefault();

    var url = reelUrlInput.value.trim();
    var category = reelCategorySelect.value;
    var note = reelNoteInput.value.trim();

    // Validate it looks like an Instagram URL
    if (
        !url.includes("instagram.com/reel") &&
        !url.includes("instagram.com/p/")
    ) {
        showToast("Please enter a valid Instagram Reel URL");
        return;
    }

    // Check for duplicates using find()
    var duplicate = reels.find(function (reel) {
        return reel.url === url;
    });
    if (duplicate) {
        showToast("This reel is already saved!");
        return;
    }

    // Show loading state
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    submitBtn.disabled = true;

    fetchReelData(url)
        .then(function (data) {
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
            // If API fails, still save with basic info
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
            btnText.classList.remove("hidden");
            btnLoader.classList.add("hidden");
            submitBtn.disabled = false;
        });
}

// ===== DELETE REEL =====
function deleteReel(id) {
    reels = reels.filter(function (reel) {
        return reel.id !== id;
    });
    saveReels();
    renderReels();
    showToast("Reel removed");
}

// ===== TOGGLE FAVORITE =====
function toggleFavorite(id) {
    reels = reels.map(function (reel) {
        if (reel.id === id) {
            return Object.assign({}, reel, { favorite: !reel.favorite });
        }
        return reel;
    });
    saveReels();
    renderReels();
}

// ===== SEARCH, FILTER, SORT (using HOFs) =====
function getFilteredReels() {
    var searchTerm = searchInput.value.trim().toLowerCase();
    var categoryFilter = filterCategory.value;
    var sortBy = sortOption.value;

    // Step 1: Filter by search term using .filter()
    var result = reels.filter(function (reel) {
        if (searchTerm === "") return true;
        var titleMatch = reel.title.toLowerCase().includes(searchTerm);
        var authorMatch = reel.author.toLowerCase().includes(searchTerm);
        var noteMatch = reel.note
            ? reel.note.toLowerCase().includes(searchTerm)
            : false;
        return titleMatch || authorMatch || noteMatch;
    });

    // Step 2: Filter by category using .filter()
    if (categoryFilter !== "all") {
        result = result.filter(function (reel) {
            return reel.category === categoryFilter;
        });
    }

    // Step 3: Filter favorites if toggled, using .filter()
    if (showOnlyFavorites) {
        result = result.filter(function (reel) {
            return reel.favorite === true;
        });
    }

    // Step 4: Sort using .sort()
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
            if (a.favorite === b.favorite) {
                return new Date(b.addedAt) - new Date(a.addedAt);
            }
            return a.favorite ? -1 : 1;
        }
        return 0;
    });

    return result;
}

// ===== RENDER REEL CARD =====
function createReelCard(reel) {
    var card = document.createElement("div");
    card.className = "reel-card";

    // Format the date
    var dateObj = new Date(reel.addedAt);
    var formattedDate = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    // Thumbnail or placeholder
    var thumbnailHTML = reel.thumbnail
        ? '<img src="' + reel.thumbnail + '" alt="' + reel.title + '" class="card-thumbnail" onerror="this.outerHTML=\'<div class=card-thumbnail-placeholder>&#127910;</div>\'">'
        : '<div class="card-thumbnail-placeholder">&#127910;</div>';

    // Note section
    var noteHTML = reel.note
        ? '<p class="card-note">"' + escapeHTML(reel.note) + '"</p>'
        : "";

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

    // Event listeners for card buttons
    var favBtn = card.querySelector(".fav-btn");
    favBtn.addEventListener("click", function () {
        toggleFavorite(reel.id);
    });

    var deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
        deleteReel(reel.id);
    });

    return card;
}


function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ===== RENDER ALL REELS =====
function renderReels() {
    var filtered = getFilteredReels();

    // Clear the grid
    reelsGrid.innerHTML = "";

    // Update count
    var total = reels.length;
    var showing = filtered.length;
    if (total === showing) {
        reelCount.textContent = total + " reel" + (total !== 1 ? "s" : "") + " saved";
    } else {
        reelCount.textContent =
            "Showing " + showing + " of " + total + " reels";
    }

    // Show empty state or cards
    if (total === 0) {
        emptyState.classList.remove("hidden");
        reelsGrid.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    reelsGrid.classList.remove("hidden");

    if (filtered.length === 0) {
        reelsGrid.innerHTML =
            '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">No reels match your search or filters.</p>';
        return;
    }

    // Build cards using forEach (HOF)
    filtered.forEach(function (reel) {
        var card = createReelCard(reel);
        reelsGrid.appendChild(card);
    });
}

// ===== DEBOUNCE (bonus feature) =====
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

// ===== EVENT LISTENERS =====

// Form submit
reelForm.addEventListener("submit", handleAddReel);

// Search with debounce
var debouncedRender = debounce(renderReels, 300);
searchInput.addEventListener("input", debouncedRender);

// Filter and sort (instant)
filterCategory.addEventListener("change", renderReels);
sortOption.addEventListener("change", renderReels);

// Favorites toggle
filterFavoritesBtn.addEventListener("click", function () {
    showOnlyFavorites = !showOnlyFavorites;
    filterFavoritesBtn.classList.toggle("active", showOnlyFavorites);
    filterFavoritesBtn.textContent = showOnlyFavorites
        ? "Show All"
        : "Show Favorites";
    renderReels();
});

// Theme toggle
themeToggle.addEventListener("click", toggleTheme);

// ===== INIT =====
loadTheme();
renderReels();