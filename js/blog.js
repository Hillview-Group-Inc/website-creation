const API_BASE_URL = "https://hvgweb.com"; //"http://localhost:3000/api";
let allArticles = [];

// Category configurations
const categories = {
  tips: {
    color: "tips",
    label: "Tips & Tricks",
    bg: "bg-green-500/20",
    text: "text-green-400",
  },
  growth: {
    color: "growth",
    label: "Growth Strategy",
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
  },
  wellness: {
    color: "wellness",
    label: "Health & Wellness",
    bg: "bg-pink-500/20",
    text: "text-pink-400",
  },
  seasonal: {
    color: "seasonal",
    label: "Seasonal",
    bg: "bg-blue-500/20",
    text: "text-blue-400",
  },
};

// Load articles on page load
window.addEventListener("load", async () => {
  await loadArticles();
});

async function loadArticles() {
  try {
    const response = await fetch(`${API_BASE_URL}/blog`);
    if (response.ok) {
      const data = await response.json();
      allArticles = data.articles;
      renderArticles(allArticles);
      document.getElementById("loading-state").classList.add("hidden");
      document.getElementById("articles-grid").classList.remove("hidden");
    } else {
      // Show error or empty state
      showError();
    }
  } catch (error) {
    console.error("Error loading articles:", error);
    showError();
  }
}

function showError() {
  document.getElementById("loading-state").innerHTML = `
                <div class="col-span-full text-center py-16">
                    <p class="text-light">Unable to load articles. Please try again later.</p>
                </div>
            `;
}

function renderArticles(articles) {
  const grid = document.getElementById("articles-grid");

  if (articles.length === 0) {
    document.getElementById("no-results").classList.remove("hidden");
    grid.classList.add("hidden");
    return;
  }

  document.getElementById("no-results").classList.add("hidden");
  grid.classList.remove("hidden");

  grid.innerHTML = articles
    .map((article) => {
      const category = categories[article.category] || categories.tips;
      const date = new Date(article.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return `
                    <article class="blog-card bg-navy/50 rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full" data-category="${article.category}">
                        <div class="p-8 flex-1">
                            <div class="article-icon ${category.bg} ${category.text}">
                                <i class="fas ${article.icon}"></i>
                            </div>
                            <span class="category-badge ${category.bg} ${category.text} mb-4">
                                <i class="fas fa-tag text-xs"></i>
                                ${category.label}
                            </span>
                            <h3 class="text-xl font-bold mb-3 line-clamp-2">${article.title}</h3>
                            <p class="text-light text-sm mb-6 line-clamp-3">${article.excerpt}</p>
                            <div class="flex items-center gap-3 mb-6">
                                <div class="w-8 h-8 rounded-full bg-royal/30 flex items-center justify-center">
                                    <i class="fas fa-user text-xs text-accent"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-medium">${article.author}</p>
                                    <p class="text-xs text-light">${date}</p>
                                </div>
                            </div>
                        </div>
                        <div class="px-8 pb-8">
                            <button onclick="openArticle(${article.id})" class="w-full bg-royal/20 hover:bg-royal hover:text-white text-accent border border-royal/50 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group">
                                Read Full Article
                                <i class="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
                            </button>
                        </div>
                    </article>
                `;
    })
    .join("");
}

function filterArticles(category) {
  // Update active button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active", "bg-royal", "border-royal", "text-white");
    btn.classList.add("border-white/20");
    if (btn.dataset.category === category) {
      btn.classList.add("active", "bg-royal", "border-royal", "text-white");
      btn.classList.remove("border-white/20");
    }
  });

  // Filter articles
  if (category === "all") {
    renderArticles(allArticles);
  } else {
    const filtered = allArticles.filter((a) => a.category === category);
    renderArticles(filtered);
  }
}

async function openArticle(id) {
  const article = allArticles.find((a) => a.id === id);
  if (!article) return;

  const category = categories[article.category] || categories.tips;
  const date = new Date(article.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const modalBody = document.getElementById("modal-body");
  modalBody.innerHTML = `
                <div class="mb-6">
                    <span class="category-badge ${category.bg} ${category.text} mb-4">
                        <i class="fas fa-tag text-xs"></i>
                        ${category.label}
                    </span>
                    <h2 class="text-3xl md:text-4xl font-bold mb-4">${article.title}</h2>
                    <div class="flex items-center gap-4 text-light text-sm">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-user text-accent"></i>
                            <span>${article.author}</span>
                        </div>
                        <span>|</span>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-calendar text-accent"></i>
                            <span>${date}</span>
                        </div>
                        <span>|</span>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-clock text-accent"></i>
                            <span>${Math.ceil(article.content.split(" ").length / 200)} min read</span>
                        </div>
                    </div>
                </div>
                <div class="prose prose-invert max-w-none">
                    <div class="text-light leading-relaxed whitespace-pre-line">${article.content}</div>
                </div>
                <div class="mt-12 pt-8 border-t border-white/10">
                    <h4 class="font-bold mb-4">Ready to grow your business?</h4>
                    <a href="contact.html" class="inline-flex items-center gap-2 bg-royal hover:bg-accent text-white px-6 py-3 rounded-full font-semibold transition-all duration-300">
                        Book a Free Consultation
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;

  document.getElementById("article-modal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("article-modal").classList.remove("active");
  document.body.style.overflow = "";
}

// Close modal on outside click
document
  .getElementById("article-modal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeModal();
  });

// Close modal on escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeModal();
});
