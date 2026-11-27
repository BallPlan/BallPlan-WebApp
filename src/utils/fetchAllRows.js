// Supabase returns at most 1,000 rows per request. Venue items already
// exceed that, so anything that loads them must page through: otherwise
// long menus are silently cut short (and saving such a venue used to
// delete the items that never loaded). `build` returns a fresh query with
// a stable order; it's called once per page.
const PAGE = 1000;

export async function fetchAllRows(build) {
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) return { data: null, error };
    all.push(...(data || []));
    if (!data || data.length < PAGE) return { data: all, error: null };
  }
}
