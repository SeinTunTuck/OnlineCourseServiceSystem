const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  // Set FRONTEND_URL to the deployed React application's exact https URL in
  // Vercel. Credentials cannot safely be used with a wildcard origin.
  "Access-Control-Allow-Origin": frontendUrl,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export default corsHeaders;
