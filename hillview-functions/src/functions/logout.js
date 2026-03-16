const { app } = require("@azure/functions");
const { buildCorsHeaders } = require("./_shared");

const CORS_METHODS = "POST, OPTIONS";

app.http("logout", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request) => {
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

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    };
  },
});
