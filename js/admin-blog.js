const API_BASE_URL = "/api";
const TOKEN_STORAGE_KEY = "hvg_admin_token";
let currentUser = null;

// Check session on load
window.addEventListener("load", async () => {
  await checkSession();
});

function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function checkSession() {
  try {
    const token = getAuthToken();
    if (!token) {
      showLogin();
      return;
    }

    const response = await fetch(`${API_BASE_URL}/checkSession`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    showLogin();
  }
}

function showLogin() {
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("dashboard-section").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("dashboard-section").classList.remove("hidden");
  document.getElementById("user-display").textContent =
    `Logged in as: ${currentUser?.username || "Admin"}`;
  loadArticles();
}

// Login form
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setAuthToken(data.token);
      currentUser = data.user;
      showDashboard();
    } else {
      const errorEl = document.getElementById("login-error");
      errorEl.textContent = data.message || "Invalid credentials";
      errorEl.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Login error:", error);
  }
});

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    });
    setAuthToken(null);
    currentUser = null;
    showLogin();
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Tab switching
function showTab(tab) {
  // Hide all tabs
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach((t) => {
    t.classList.remove("tab-active");
    t.classList.add("text-light");
  });

  // Show selected tab
  document.getElementById(`content-${tab}`).classList.remove("hidden");
  document.getElementById(`tab-${tab}`).classList.add("tab-active");
  document.getElementById(`tab-${tab}`).classList.remove("text-light");

  // Reset form if switching to new
  if (tab === "new") {
    resetForm();
  }
}

function resetForm() {
  document.getElementById("article-form").reset();
  document.getElementById("article-id").value = "";
  document.getElementById("form-title").textContent = "Create New Article";
}

// Load articles
async function loadArticles() {
  try {
    const response = await fetch(`${API_BASE_URL}/getAdminArticles`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (response.ok) {
      const data = await response.json();
      renderArticlesList(data.articles);
    }
  } catch (error) {
    console.error("Error loading articles:", error);
  }
}

function renderArticlesList(articles) {
  const container = document.getElementById("articles-list");

  if (articles.length === 0) {
    container.innerHTML = `
                    <div class="p-12 text-center text-light">
                        <i class="fas fa-inbox text-4xl mb-4 opacity-50"></i>
                        <p>No articles yet. Create your first article!</p>
                    </div>
                `;
    return;
  }

  container.innerHTML = `
                <table class="w-full">
                    <thead class="border-b border-white/10">
                        <tr>
                            <th class="text-left p-4 text-sm font-medium text-light">Article</th>
                            <th class="text-left p-4 text-sm font-medium text-light">Category</th>
                            <th class="text-left p-4 text-sm font-medium text-light">Date</th>
                            <th class="text-right p-4 text-sm font-medium text-light">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${articles
                          .map(
                            (article) => `
                            <tr class="article-row border-b border-white/5">
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-royal/20 flex items-center justify-center">
                                            <i class="fas ${article.icon} text-accent"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium">${article.title}</p>
                                            <p class="text-xs text-light">${article.author}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-royal/20 text-accent capitalize">
                                        ${article.category}
                                    </span>
                                </td>
                                <td class="p-4 text-light text-sm">
                                    ${new Date(article.createdAt).toLocaleDateString()}
                                </td>
                                <td class="p-4 text-right">
                                    <button onclick="editArticle(${article.id})" class="text-accent hover:text-white mr-3 transition-colors">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteArticle(${article.id})" class="text-red-400 hover:text-red-300 transition-colors">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            `;
}

// Article form submission
document
  .getElementById("article-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("article-id").value;
    const articleData = {
      title: document.getElementById("article-title").value,
      author: document.getElementById("article-author").value,
      category: document.getElementById("article-category").value,
      icon: document.getElementById("article-icon").value,
      excerpt: document.getElementById("article-excerpt").value,
      content: document.getElementById("article-content").value,
    };

    try {
      const url = id
        ? `${API_BASE_URL}/updateArticle?id=${encodeURIComponent(id)}`
        : `${API_BASE_URL}/createNewArticle`;
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        showTab("articles");
        loadArticles();
      } else {
        alert("Failed to save article. Please try again.");
      }
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Error saving article. Please check your connection.");
    }
  });

async function editArticle(id) {
  const article = await fetch(
    `${API_BASE_URL}/getArticle?id=${encodeURIComponent(id)}`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    },
  )
    .then((r) => r.json())
    .then((d) => d.article);

  if (!article) return;

  document.getElementById("article-id").value = article.id;
  document.getElementById("article-title").value = article.title;
  document.getElementById("article-author").value = article.author;
  document.getElementById("article-category").value = article.category;
  document.getElementById("article-icon").value = article.icon;
  document.getElementById("article-excerpt").value = article.excerpt;
  document.getElementById("article-content").value = article.content;

  document.getElementById("form-title").textContent = "Edit Article";
  showTab("new");
}

async function deleteArticle(id) {
  if (
    !confirm(
      "Are you sure you want to delete this article? This action cannot be undone.",
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/deleteArticle?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      },
    );

    if (response.ok) {
      loadArticles();
    } else {
      alert("Failed to delete article.");
    }
  } catch (error) {
    console.error("Error deleting article:", error);
  }
}
