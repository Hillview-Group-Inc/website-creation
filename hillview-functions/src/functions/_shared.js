const DEFAULT_ALLOWED_ORIGINS = [
  "https://hvgweb.com",
  "https://www.hvgweb.com",
  "https://hvgweb.com/blog",
  "https://orange-sea-03d42eb0f.2.azurestaticapps.net",
];

const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set([...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins]);

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

function buildCorsHeaders(methods, requestOrigin) {
  const headers = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };

  if (requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
  }

  return headers;
}

module.exports = {
  dbConfig,
  buildCorsHeaders,
};
