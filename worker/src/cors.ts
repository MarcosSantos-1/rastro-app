const ALLOW_HEADERS =
  "Authorization, Content-Type, X-Denuncia-Id, X-Foto-Index";
const ALLOW_METHODS = "GET, POST, DELETE, OPTIONS";

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
    },
  });
}

export function emptyCors(request: Request, status = 204): Response {
  return new Response(null, { status, headers: corsHeaders(request) });
}
