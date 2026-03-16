const { app } = require("@azure/functions");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sql = require("mssql");

const ALLOWED_ORIGIN = "https://hvgweb.com";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const JWT_SECRET =
  process.env.JWT_SECRET || "hillview-jwt-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// SQL Server Configuration (env-based)
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

// In-memory mock storage (used only if DB is unavailable)
const mockStorage = {
  users: [],
};

let dbPool = null;
let useMockMode = false;

async function initializeMockAdmin() {
  if (mockStorage.users.length === 0) {
    const hashedPassword = await bcrypt.hash("HillviewAdmin2024!", 10);
    mockStorage.users.push({
      id: 1,
      username: "admin",
      password_hash: hashedPassword,
      email: "admin@hillviewgroup.com",
      role: "admin",
      is_active: true,
      created_at: new Date(),
    });
  }
}

async function initializeAdminUser() {
  try {
    const result = await dbPool
      .request()
      .query("SELECT COUNT(*) as count FROM Users WHERE username = 'admin'");

    if (result.recordset[0].count === 0) {
      const hashedPassword = await bcrypt.hash("HillviewAdmin2024!", 10);

      await dbPool
        .request()
        .input("username", sql.NVarChar, "admin")
        .input("password_hash", sql.NVarChar, hashedPassword)
        .input("email", sql.NVarChar, "admin@hillviewgroup.com")
        .input("role", sql.NVarChar, "admin")
        .query(`INSERT INTO Users (username, password_hash, email, role, is_active) 
                        VALUES (@username, @password_hash, @email, @role, 1)`);
    }
  } catch (err) {
    // Do not fail the function on admin bootstrap errors
  }
}

async function ensureDbPool() {
  if (useMockMode) return null;
  if (dbPool) return dbPool;

  try {
    dbPool = await sql.connect(dbConfig);
    await initializeAdminUser();
    return dbPool;
  } catch (err) {
    useMockMode = true;
    await initializeMockAdmin();
    return null;
  }
}

app.http("login", {
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
      await ensureDbPool();

      const body = await request.json();
      const { username, password } = body || {};

      if (!username || !password) {
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            message: "Username and password required",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      let user;

      if (useMockMode) {
        user = mockStorage.users.find((u) => u.username === username);
      } else {
        const result = await dbPool
          .request()
          .input("username", sql.NVarChar, username)
          .query(
            "SELECT * FROM Users WHERE username = @username AND is_active = 1",
          );
        user = result.recordset[0];
      }

      if (!user) {
        return {
          status: 401,
          body: JSON.stringify({
            success: false,
            message: "Invalid credentials",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return {
          status: 401,
          body: JSON.stringify({
            success: false,
            message: "Invalid credentials",
          }),
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        };
      }

      // Update last login
      if (!useMockMode) {
        await dbPool
          .request()
          .input("id", sql.Int, user.id)
          .query("UPDATE Users SET last_login = GETDATE() WHERE id = @id");
      }

      const token = jwt.sign(
        {
          sub: String(user.id),
          username: user.username,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "Login successful",
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    } catch (error) {
      context.error("Login error:", error);
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          message: "Server error during login",
        }),
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      };
    }
  },
});
