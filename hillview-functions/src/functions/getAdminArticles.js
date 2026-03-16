const { app } = require("@azure/functions");
const jwt = require("jsonwebtoken");
const sql = require("mssql");
const { mockArticles } = require("./_mockData");
const { dbConfig, buildCorsHeaders } = require("./_shared");

const CORS_METHODS = "GET, OPTIONS";

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

app.http("getAdminArticles", {
  methods: ["GET", "OPTIONS"],
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

      let articles;
      if (useMockMode) {
        articles = mockStorage.articles.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
      } else {
        const result = await dbPool.request()
          .query(`SELECT id, title, excerpt, category, icon, author, status,
                        created_at as createdAt, view_count as viewCount
                        FROM Articles 
                        ORDER BY created_at DESC`);
        articles = result.recordset;
      }

      return {
        status: 200,
        body: JSON.stringify({ success: true, articles }),
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      };
    } catch (error) {
      context.error("Error fetching admin articles:", error);
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          message: "Failed to fetch articles",
        }),
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      };
    }
  },
});
