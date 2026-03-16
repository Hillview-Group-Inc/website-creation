const { app } = require("@azure/functions");
const jwt = require("jsonwebtoken");
const sql = require("mssql");
const { mockArticles } = require("./_mockData");
const { dbConfig, buildCorsHeaders } = require("./_shared");

const CORS_METHODS = "DELETE, OPTIONS";

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

app.http("deleteArticle", {
  methods: ["DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const corsHeaders = buildCorsHeaders(
      CORS_METHODS,
      request.headers.get("origin"),
    );

    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders,
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
            ...corsHeaders,
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
            ...corsHeaders,
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
            ...corsHeaders,
          },
        };
      }

      await ensureDbPool();

      const idParam = request.params?.id || request.query?.get("id");
      const id = parseInt(idParam, 10);
      if (!Number.isInteger(id)) {
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            message: "Invalid article id",
          }),
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        };
      }

      let existingArticle;
      if (useMockMode) {
        existingArticle = mockStorage.articles.find((a) => a.id === id);
        if (existingArticle) {
          mockStorage.articles = mockStorage.articles.filter((a) => a.id !== id);
        }
      } else {
        const checkResult = await dbPool
          .request()
          .input("id", sql.Int, id)
          .query("SELECT id FROM Articles WHERE id = @id");
        existingArticle = checkResult.recordset[0];

        if (existingArticle) {
          await dbPool
            .request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Articles WHERE id = @id");
        }
      }

      if (!existingArticle) {
        return {
          status: 404,
          body: JSON.stringify({
            success: false,
            message: "Article not found",
          }),
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        };
      }

      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "Article deleted successfully",
        }),
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      };
    } catch (error) {
      context.error("Error deleting article:", error);
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          message: "Failed to delete article",
        }),
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      };
    }
  },
});
