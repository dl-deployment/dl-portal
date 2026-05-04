export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const [epic, steam] = await Promise.allSettled([
    fetchEpicFreeGames(),
    fetchSteamFreeGames(),
  ]);

  res.status(200).json({
    epic: epic.status === "fulfilled" ? epic.value : [],
    steam: steam.status === "fulfilled" ? steam.value : [],
    errors: [
      epic.status === "rejected" ? { store: "epic", error: epic.reason?.message } : null,
      steam.status === "rejected" ? { store: "steam", error: steam.reason?.message } : null,
    ].filter(Boolean),
  });
}

async function fetchEpicFreeGames() {
  const url =
    "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US";
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Epic API ${resp.status}`);
  const json = await resp.json();

  const elements = json?.data?.Catalog?.searchStore?.elements ?? [];
  const now = new Date();
  const games = [];

  for (const el of elements) {
    const promos =
      el.promotions?.promotionalOffers?.[0]?.promotionalOffers ?? [];
    const activePromo = promos.find((p) => {
      if (p.discountSetting?.discountPercentage !== 0) return false;
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return now >= start && now <= end;
    });
    if (!activePromo) continue;

    const image =
      el.keyImages?.find((k) => k.type === "OfferImageWide")?.url ??
      el.keyImages?.find((k) => k.type === "Thumbnail")?.url ??
      el.keyImages?.[0]?.url ??
      "";

    const slug =
      el.catalogNs?.mappings?.[0]?.pageSlug ??
      el.offerMappings?.[0]?.pageSlug ??
      el.productSlug ??
      el.urlSlug ??
      "";

    const originalPrice =
      el.price?.totalPrice?.fmtPrice?.originalPrice ?? "";

    games.push({
      title: el.title,
      image,
      url: slug
        ? `https://store.epicgames.com/en-US/p/${slug}`
        : "https://store.epicgames.com/en-US/free-games",
      originalPrice,
      endDate: activePromo.endDate,
      store: "epic",
    });
  }

  return games;
}

async function fetchSteamFreeGames() {
  const url =
    "https://store.steampowered.com/search/?specials=1&maxprice=free&category1=998";
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!resp.ok) throw new Error(`Steam search ${resp.status}`);
  const html = await resp.text();

  const games = [];
  const rowRegex =
    /<a[^>]*href="(https:\/\/store\.steampowered\.com\/app\/\d+\/[^"]*)"[^>]*class="search_result_row[^"]*"[^>]*>[\s\S]*?<\/a>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const block = match[0];
    const gameUrl = match[1];

    const titleMatch = block.match(
      /<span class="title">([^<]+)<\/span>/
    );
    const imgMatch = block.match(
      /<img[^>]*src="([^"]+)"[^>]*>/
    );
    const origPriceMatch = block.match(
      /<span[^>]*class="[^"]*discount_original_price[^"]*"[^>]*>([^<]+)<\/span>/
    );
    const discountMatch = block.match(
      /<div[^>]*class="[^"]*discount_pct[^"]*"[^>]*>([^<]+)<\/div>/
    );

    const discount = discountMatch
      ? discountMatch[1].trim().replace("-", "").replace("%", "")
      : "";

    if (discount !== "100") continue;

    games.push({
      title: titleMatch ? titleMatch[1].trim() : "Unknown",
      image: imgMatch ? imgMatch[1].replace(/capsule_sm_120/, "header") : "",
      url: gameUrl,
      originalPrice: origPriceMatch ? origPriceMatch[1].trim() : "",
      store: "steam",
    });
  }

  return games;
}
