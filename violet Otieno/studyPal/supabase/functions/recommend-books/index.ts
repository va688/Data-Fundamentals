import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: cors() });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const { courses = [] } = await req.json();
    const queries = (courses as string[]).slice(0, 5).map((c) => `${c} textbook`);

    const results = await Promise.all(
      queries.map((q) =>
        fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&printType=books&orderBy=relevance`,
        )
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] }))
      ),
    );

    const seen = new Set<string>();
    const books: Array<{ title: string; author?: string; url?: string }> = [];
    for (const r of results) {
      for (const it of (r as any).items ?? []) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        const v = it.volumeInfo ?? {};
        books.push({
          title: v.title,
          author: (v.authors ?? [])[0],
          url: v.infoLink ?? v.previewLink,
        });
      }
    }

    return json({ books: books.slice(0, 12) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}, { onListen: () => {} });

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
  };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors() } });
}
