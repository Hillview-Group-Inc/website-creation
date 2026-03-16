const { app } = require("@azure/functions");
const sql = require("mssql");
const { mockArticles } = require("./_mockData");
const { dbConfig, buildCorsHeaders } = require("./_shared");

const CORS_HEADERS = buildCorsHeaders("GET, OPTIONS");

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

app.http("getArticle", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: CORS_HEADERS,
      };
    }

    try {
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
            ...CORS_HEADERS,
          },
        };
      }

      let article;

      if (useMockMode) {
        article = mockStorage.articles.find(
          (a) => a.id === id && a.status === "published",
        );
        if (article) {
          article.view_count++;
        }
      } else {
        const result = await dbPool
          .request()
          .input("id", sql.Int, id)
          .query(
            `SELECT id, title, excerpt, content, category, icon, author, 
                        created_at as createdAt, view_count as viewCount
                        FROM Articles 
                        WHERE id = @id AND status = 'published'`,
          );

        article = result.recordset[0];

        if (article) {
          await dbPool
            .request()
            .input("id", sql.Int, id)
            .query(
              "UPDATE Articles SET view_count = view_count + 1 WHERE id = @id",
            );
        }
      }

      if (!article) {
        return {
          status: 404,
          body: JSON.stringify({
            success: false,
            message: "Article not found",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      return {
        status: 200,
        body: JSON.stringify({ success: true, article }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    } catch (error) {
      context.error("Error fetching article:", error);
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          message: "Failed to fetch article",
        }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    }
  },
});
