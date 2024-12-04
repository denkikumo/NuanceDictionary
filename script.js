document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.createElement("div");
    searchResults.id = "searchResults";
    document.querySelector("main").appendChild(searchResults);

    const filterBtn = document.getElementById("filterBtn");
    const modal = document.getElementById("filterModal");
    const closeModalBtn = document.querySelector(".close-btn");
    const applyFiltersBtn = document.getElementById("applyFilters");
    const clearModalFiltersBtn = document.getElementById("modalClearFiltersBtn");
    const selectedFiltersDisplay = document.getElementById("filtersDisplay");
    const activeFilters = document.getElementById("activeFilters");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const clearSearchBtn = document.getElementById("clearBtn");

    let vocabData = [];
    let selectedFilters = []; // Store active filters

    // Fetch vocab.json on page load
    fetch("vocab.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to load JSON file");
            }
            return response.json();
        })
        .then((data) => {
            vocabData = data.map((word) => ({
                ...word,
                joinedKanji: word.japaneseWord.kanji.join(""),
                joinedRomaji: word.japaneseWord.romaji.join("")
            }));
            console.log("Data loaded:", vocabData);

            // Initialize Fuse.js
            const fuse = new Fuse(vocabData, {
                keys: [
                    "englishWords",
                    "japaneseWord.fullKana",
                    "joinedKanji",
                    "joinedRomaji"
                ],
                threshold: 0.3
            });

            // Add search functionality
            document.getElementById("searchBtn").addEventListener("click", () => {
                performSearch(fuse);
            });

            searchInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    performSearch(fuse);
                }
            });

            // Check for a hash in the URL on page load
            const handleHashSearch = () => {
                const hashQuery = window.location.hash.substring(1); // Get the hash without the '#' symbol
                if (hashQuery) {
                    searchInput.value = decodeURIComponent(hashQuery); // Populate the search input
                    performSearch(fuse); // Perform the search automatically
                }
            };

            // Listen for changes to the URL hash (e.g., when clicking a Comparable Word link)
            window.addEventListener("hashchange", handleHashSearch);

            // Perform the initial hash-based search when the page loads
            handleHashSearch();
        })
        .catch((error) => console.error("Error fetching JSON:", error));

    // Open the filter modal
    filterBtn.addEventListener("click", () => {
        modal.style.display = "block";
    });

    // Close the filter modal
    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close the modal when clicking outside it
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Clear filters inside modal
    clearModalFiltersBtn.addEventListener("click", () => {
        const checkboxes = document.querySelectorAll("#filterForm input[type='checkbox']");
        checkboxes.forEach((checkbox) => (checkbox.checked = false));
        selectedFilters = [];
        updateSelectedFiltersDisplay(selectedFilters);
    });

    // Apply filters and close modal
    applyFiltersBtn.addEventListener("click", () => {
        const checkboxes = document.querySelectorAll("#filterForm input[type='checkbox']");
        selectedFilters = Array.from(checkboxes)
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);

        updateSelectedFiltersDisplay(selectedFilters);
        modal.style.display = "none";
        performSearch();
    });

    // Clear all filters from the displayed section
    clearFiltersBtn.addEventListener("click", () => {
        selectedFilters = [];
        updateSelectedFiltersDisplay(selectedFilters);
        performSearch(); // Refresh the search results without filters
    });

    // Clear search input field button functionality
    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = ""; // Clear input field
        searchResults.innerHTML = ""; // Clear search results completely
        window.history.pushState({}, "", window.location.pathname); // Remove query from URL
        updateSelectedFiltersDisplay([]); // Clear displayed filters
    });

    // Display active filters beneath the search bar
    function updateSelectedFiltersDisplay(filters) {
        if (filters.length === 0) {
            selectedFiltersDisplay.style.display = "none";
        } else {
            selectedFiltersDisplay.style.display = "flex";
            activeFilters.textContent = filters.join(", ");
        }
    }

    // Perform search
    function performSearch(fuse) {
        const query = searchInput.value.trim().toLowerCase();

        // Update the URL hash with the query
        if (query) {
            window.history.pushState({}, "", `#${encodeURIComponent(query)}`);
        } else {
            // Clear the hash if the search input is empty
            window.history.pushState({}, "", window.location.pathname);
        }

        const results = vocabData.filter((word) => {
            const matchesQuery =
                word.englishWords.some((englishGroup) =>
                    englishGroup.some((englishWord) =>
                        englishWord.toLowerCase().includes(query)
                    )
                ) ||
                word.japaneseWord.fullKana.includes(query) ||
                word.joinedKanji.includes(query) ||
                word.joinedRomaji.includes(query);

            // Adjusted filter logic: Match if at least one selected filter applies
            const matchesFilters =
                selectedFilters.length === 0 ||
                selectedFilters.some((filter) => word.tone.includes(filter));

            return matchesQuery && matchesFilters;
        });

        displayResults(results);
    }

    function displayResults(results) {
        searchResults.innerHTML = ""; // Clear previous results
    
        if (results.length === 0) {
            searchResults.innerHTML = "<p>No results found.</p>";
            return;
        }
    
        results.forEach((word) => {
            const wordEntry = document.createElement("div");
            wordEntry.classList.add("word-entry");
    
            // Left Section
            const leftSection = document.createElement("div");
            leftSection.classList.add("left-section");
    
            const japanese = document.createElement("div");
            japanese.classList.add("japanese");
    
            const kanaContainer = document.createElement("div");
            kanaContainer.classList.add("kana-container");
            word.japaneseWord.kana.forEach((kana) => {
                const kanaElement = document.createElement("p");
                kanaElement.classList.add("kana");
                kanaElement.textContent = kana;
                kanaContainer.appendChild(kanaElement);
            });
            japanese.appendChild(kanaContainer);
    
            const kanjiElement = document.createElement("h1");
            kanjiElement.classList.add("kanji");
            kanjiElement.textContent = word.japaneseWord.kanji.join("");
            japanese.appendChild(kanjiElement);
    
            // Tone Paragraph
            const toneParagraph = document.createElement("p");
            toneParagraph.classList.add("tone-paragraph");
            toneParagraph.textContent = `${word.tone.join(", ")}`;
            japanese.appendChild(toneParagraph);
    
            leftSection.appendChild(japanese);
    
            const englishMeanings = document.createElement("div");
            englishMeanings.classList.add("english-meanings");
            word.englishWords.forEach((line) => {
                const lineElement = document.createElement("p");
                lineElement.textContent = line.join("; ") + ";";
                englishMeanings.appendChild(lineElement);
            });
            leftSection.appendChild(englishMeanings);
    
            wordEntry.appendChild(leftSection);
    
            // Right Section
            const rightSection = document.createElement("div");
            rightSection.classList.add("right-section");
    
            // Nuance Section
            if (word.nuance) {
                const nuanceSection = document.createElement("div");
                nuanceSection.classList.add("nuance-section");
    
                const nuanceHeading = document.createElement("h2");
                nuanceHeading.textContent = "Nuance";
    
                const nuanceParagraph = document.createElement("p");
                nuanceParagraph.textContent = word.nuance;
    
                nuanceSection.appendChild(nuanceHeading);
                nuanceSection.appendChild(nuanceParagraph);
                rightSection.appendChild(nuanceSection);
            }
    
            if (word.examples) {
                const examples = document.createElement("div");
                examples.classList.add("examples");
    
                const examplesHeading = document.createElement("h2");
                examplesHeading.textContent = "Example sentences";
                examples.appendChild(examplesHeading);
    
                word.examples.forEach((example) => {
                    const exampleText = document.createElement("p");
                    const exampleJapanese = document.createElement("strong");
                    exampleJapanese.textContent = example.japanese;
                    exampleText.appendChild(exampleJapanese);
                    exampleText.innerHTML += ` ${example.english}`;
                    examples.appendChild(exampleText);
                });
    
                rightSection.appendChild(examples);
            }
    
            if (word.comparableWords && word.comparableWords.length > 0) {
                const comparableSection = document.createElement("div");
                comparableSection.classList.add("comparable-words");
    
                const comparableHeading = document.createElement("h2");
                comparableHeading.textContent = "Comparable Words";
                comparableSection.appendChild(comparableHeading);
    
                const comparableList = document.createElement("p");
                word.comparableWords.forEach((comp, index) => {
                    const link = document.createElement("a");
                    link.textContent = comp.kanji;
                    link.href = `#${comp.kanji}`; // Link to the hash for the comparable word
                    link.classList.add("comparable-word");
    
                    comparableList.appendChild(link);
    
                    if (index < word.comparableWords.length - 1) {
                        comparableList.appendChild(document.createTextNode(", ")); // Add a comma between words
                    }
                });
                comparableSection.appendChild(comparableList);
                rightSection.appendChild(comparableSection);
            }
    
            wordEntry.appendChild(rightSection);
            searchResults.appendChild(wordEntry);
        });
    }
    
    
});
