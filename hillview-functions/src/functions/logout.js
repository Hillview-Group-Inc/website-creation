const { app } = require("@azure/functions");

const ALLOWED_ORIGIN = "https://hvgweb.com";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

app.http("logout", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request) => {
    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: CORS_HEADERS,
      };
    }

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    };
  },
});
