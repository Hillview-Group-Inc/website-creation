const { app } = require("@azure/functions");
const jwt = require("jsonwebtoken");
const sql = require("mssql");

const ALLOWED_ORIGIN = "https://hvgweb.com";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const JWT_SECRET =
  process.env.JWT_SECRET || "hillview-jwt-secret-change-in-production";

const dbConfig = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "HillviewBlog",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
};

let dbPool = null;

async function ensureDbPool() {
  if (dbPool) return dbPool;
  try {
    dbPool = await sql.connect(dbConfig);
    return dbPool;
  } catch (err) {
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

app.http("checkSession", {
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
      const token = getBearerToken(request);
      if (!token) {
        return {
          status: 401,
          body: JSON.stringify({
            success: false,
            message: "Not authenticated",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      const payload = jwt.verify(token, JWT_SECRET);
      const userId = parseInt(payload.sub, 10);

      const pool = await ensureDbPool();
      if (pool) {
        const result = await pool
          .request()
          .input("id", sql.Int, userId)
          .query(
            "SELECT id, username, email, role FROM Users WHERE id = @id AND is_active = 1",
          );

        if (result.recordset.length === 0) {
          return {
            status: 401,
            body: JSON.stringify({
              success: false,
              message: "Session invalid",
            }),
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          };
        }

        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            user: result.recordset[0],
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          user: {
            id: userId,
            username: payload.username,
            role: payload.role,
          },
        }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    } catch (error) {
      context.error("Check session error:", error);
      return {
        status: 401,
        body: JSON.stringify({
          success: false,
          message: "Session invalid",
        }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    }
  },
});
