const { app } = require("@azure/functions");
const sql = require("mssql");
const { mockArticles } = require("./_mockData");
const { dbConfig, buildCorsHeaders } = require("./_shared");

const CORS_METHODS = "GET, OPTIONS";

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

app.http("getAllArticles", {
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
      await ensureDbPool();

      let articles;

      if (useMockMode) {
        articles = mockStorage.articles
          .filter((a) => a.status === "published")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        const result = await dbPool.request().query(
          `SELECT id, title, excerpt, category, icon, author, 
                        created_at as createdAt, view_count as viewCount
                        FROM Articles 
                        WHERE status = 'published' 
                        ORDER BY created_at DESC`,
        );
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
      context.error("Error fetching articles:", error);
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
