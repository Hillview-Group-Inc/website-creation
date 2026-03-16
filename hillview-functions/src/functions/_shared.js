const ALLOWED_ORIGIN = ["https://hvgweb.com", "https://hvgweb.com/blog"];

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

function buildCorsHeaders(methods) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

module.exports = {
  dbConfig,
  buildCorsHeaders,
};
