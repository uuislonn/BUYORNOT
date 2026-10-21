export function GET() {
  return Response.json(
    { status: "ok", service: "buyornot" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
