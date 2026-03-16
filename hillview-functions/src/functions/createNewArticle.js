const { app } = require("@azure/functions");
const jwt = require("jsonwebtoken");
const sql = require("mssql");
const { mockArticles } = require("./_mockData");
const { dbConfig, buildCorsHeaders } = require("./_shared");

const CORS_HEADERS = buildCorsHeaders("POST, OPTIONS");

const JWT_SECRET =
  process.env.JWT_SECRET || "hillview-jwt-secret-change-in-production";

// Mock storage (used only if DB is unavailable)
const mockStorage = {
  articles: [...mockArticles],
};

let dbPool = null;
let useMockMode = false;

async function ensureDbPool() {
  if (useMockMode) return null;
  if (dbPool) return dbPool;
  try {
    dbPool = await sql.connect(dbConfig);
    return dbPool;
  } catch (err) {
    useMockMode = true;
    return null;
  }
}

function getBearerToken(request) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization") ||
    "";
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

app.http("createNewArticle", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: CORS_HEADERS,
      };
    }

    try {
      const token = getBearerToken(request);
      if (!token) {
        return {
          status: 401,
          body: JSON.stringify({
            success: false,
            message: "Authentication required",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return {
          status: 401,
          body: JSON.stringify({
            success: false,
            message: "Invalid token",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      if (payload.role !== "admin") {
        return {
          status: 403,
          body: JSON.stringify({
            success: false,
            message: "Admin access required",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      await ensureDbPool();

      const body = await request.json();
      const { title, excerpt, content, category, icon, author } = body || {};

      if (!title || !excerpt || !content || !category || !author) {
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            message:
              "Title, excerpt, content, category, and author are required",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      const validCategories = ["tips", "growth", "wellness", "seasonal"];
      if (!validCategories.includes(category)) {
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            message:
              "Invalid category. Must be one of: tips, growth, wellness, seasonal",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      let newArticle;

      if (useMockMode) {
        newArticle = {
          id: mockStorage.articles.length + 1,
          title,
          excerpt,
          content,
          category,
          icon: icon || "fa-lightbulb",
          author,
          status: "published",
          createdAt: new Date(),
          view_count: 0,
        };
        mockStorage.articles.push(newArticle);
      } else {
        const createdBy = parseInt(payload.sub, 10);
        const result = await dbPool
          .request()
          .input("title", sql.NVarChar, title)
          .input("excerpt", sql.NVarChar, excerpt)
          .input("content", sql.NVarChar(sql.MAX), content)
          .input("category", sql.NVarChar, category)
          .input("icon", sql.NVarChar, icon || "fa-lightbulb")
          .input("author", sql.NVarChar, author)
          .input("status", sql.NVarChar, "published")
          .input("created_by", sql.Int, createdBy)
          .query(`INSERT INTO Articles (title, excerpt, content, category, icon, author, status, created_by, published_at)
                        OUTPUT INSERTED.*
                        VALUES (@title, @excerpt, @content, @category, @icon, @author, @status, @created_by, GETDATE())`);

        newArticle = result.recordset[0];
      }

      return {
        status: 201,
        body: JSON.stringify({
          success: true,
          message: "Article created successfully",
          article: newArticle,
        }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    } catch (error) {
      context.error("Error creating article:", error);
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          message: "Failed to create article",
        }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    }
  },
});
