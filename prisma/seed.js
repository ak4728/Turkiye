// Seeds the database with a curated set of Istanbul's most-visited places,
// engaging descriptions, and up to 5 real photos per place.
//
// Image source (both legal — no HTML scraping / no bypassing bot protection):
//   • If GOOGLE_API_KEY and GOOGLE_CSE_ID are set in the environment, it uses
//     Google's official Custom Search JSON API (image mode) — real Google
//     results, ~100 free queries/day. Set up a key + Programmable Search Engine
//     at https://developers.google.com/custom-search/v1/overview
//   • Otherwise it falls back to Openverse (api.openverse.org), a keyless search
//     engine for openly-licensed images from across the web (Flickr, museums,
//     Wikimedia, etc.).
//
// Run with:  npm run db:seed
// Idempotent: matches existing pins by name, refreshes their description + photos.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fallback topical placeholder if an image search returns nothing.
const CATEGORY_IMG = {
  restaurant: "istanbul,restaurant,food",
  sight: "istanbul,landmark",
  poi: "istanbul,cityscape",
  experience: "istanbul,culture",
  hotel: "istanbul,hotel",
  shopping: "istanbul,market",
  other: "istanbul",
};
function photoFor(category, lock) {
  const tags = CATEGORY_IMG[category] ?? "istanbul";
  return `https://loremflickr.com/800/600/${tags}?lock=${lock}`;
}

// Optional search-query overrides for better image relevance.
const SEARCH = {
  "Bosphorus Cruise (Eminönü piers)": "Bosphorus Istanbul ferry",
  "Whirling Dervishes (Hodjapasha)": "whirling dervishes Istanbul",
  "Karaköy backstreets (bars)": "Karaköy Istanbul street night",
  "Serencebey (cafés & restaurants)": "Serencebey Beşiktaş Istanbul",
  "Beşiktaş Fish Market": "Beşiktaş fish market Istanbul",
  "Bebek Bay (seaside walk)": "Bebek Bosphorus Istanbul",
  "Moda Seaside (Moda Sahili)": "Moda Kadıköy seaside Istanbul",
  "Moda Çay Bahçesi": "Moda tea garden Istanbul",
  "Kadıköy Rıhtım": "Kadıköy ferry pier Istanbul",
  "Kadıköy Çarşı (market)": "Kadıköy market Istanbul",
  "Fener & Balat": "Balat Istanbul colorful houses",
  "Eyüp Sultan Mosque": "Eyüp Sultan Mosque Istanbul",
};
function queryFor(pin) {
  const base = SEARCH[pin.name] || pin.name.replace(/\(.*?\)/g, "").trim();
  return /istanbul/i.test(base) ? base : `${base} Istanbul`;
}

async function googleImages(q, n) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return null; // signal "not configured"
  const out = [];
  try {
    const url =
      `https://www.googleapis.com/customsearch/v1?searchType=image` +
      `&num=${Math.min(n, 10)}&key=${key}&cx=${cx}&q=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      for (const it of j.items || []) {
        if (out.length >= n) break;
        if (it.link && /^https?:\/\//.test(it.link)) out.push(it.link);
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

async function openverseImages(q, n) {
  const out = [];
  try {
    const url =
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}` +
      `&page_size=${n * 2}&mature=false`;
    const r = await fetch(url, {
      headers: { "user-agent": "TurkiyeTravelMap/1.0 (personal, non-commercial)" },
    });
    if (r.ok) {
      const j = await r.json();
      for (const it of j.results || []) {
        if (out.length >= n) break;
        const u = it.thumbnail || it.url;
        if (u && /^https?:\/\//.test(u)) out.push(u);
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Top-N images for a query: Google (if configured) then Openverse fallback. */
async function fetchImages(q, n) {
  const g = await googleImages(q, n);
  if (g === null) return openverseImages(q, n); // Google not configured
  if (g.length) return g;
  return openverseImages(q, n); // Google configured but empty -> fall back
}

/**
 * @typedef {Object} SeedPin
 * @property {string} name
 * @property {"restaurant"|"sight"|"poi"|"experience"|"hotel"|"shopping"|"other"} category
 * @property {string} description
 * @property {string} address
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} rating
 * @property {string[]} tags
 */

/** @type {SeedPin[]} */
const ISTANBUL_PINS = [
  // ── Places to See ────────────────────────────────────────────────────────
  {
    name: "Hagia Sophia",
    category: "sight",
    description:
      "Few buildings on earth have lived as many lives as Ayasofya. Built by the Byzantine emperor Justinian in 537 AD, it reigned for almost a thousand years as the greatest cathedral in Christendom, became an imperial mosque after the Ottoman conquest of 1453, spent the 20th century as a museum, and is a working mosque once more. Step inside and the vast 55-metre golden dome seems to float on light, while shimmering Christian mosaics and giant discs of Islamic calligraphy share the same soaring walls.",
    address: "Sultan Ahmet, Ayasofya Meydanı, Fatih",
    latitude: 41.008587,
    longitude: 28.980175,
    rating: 5,
    tags: ["must-see", "byzantine", "ottoman", "unesco"],
  },
  {
    name: "Blue Mosque (Sultan Ahmed Mosque)",
    category: "sight",
    description:
      "Sultan Ahmed I was barely nineteen when he ordered this showstopper built directly opposite Hagia Sophia in the early 1600s, determined to outshine its ancient neighbour. Its nickname comes from the more than 20,000 hand-painted İznik tiles that wash the interior in shades of blue, lit by hundreds of windows. Crowned by a cascade of domes and six slender minarets, it is still an active mosque — time your visit around the five daily prayers.",
    address: "Sultan Ahmet, Atmeydanı Cd. No:7, Fatih",
    latitude: 41.00539,
    longitude: 28.976807,
    rating: 5,
    tags: ["must-see", "mosque", "ottoman", "free"],
  },
  {
    name: "Topkapı Palace",
    category: "sight",
    description:
      "For nearly four centuries this was the beating heart of the Ottoman Empire — part royal residence, part seat of government, part legend. Sprawling across a headland above the Bosphorus, its courtyards, tiled pavilions and the secretive Harem once housed thousands, from the sultan and his family to concubines and the palace guard. Don't miss the Treasury, home to the emerald-hilted Topkapı Dagger and the 86-carat Spoonmaker's Diamond.",
    address: "Cankurtaran, Fatih",
    latitude: 41.011555,
    longitude: 28.983577,
    rating: 5,
    tags: ["must-see", "palace", "ottoman", "museum"],
  },
  {
    name: "Basilica Cistern (Yerebatan Sarnıcı)",
    category: "sight",
    description:
      "Beneath the streets of the old city lies an underground palace of water. Built by Justinian in the 6th century to supply the imperial quarter, this cathedral-sized cistern is held up by 336 columns rising straight from the water, many recycled from older Roman temples. Follow the dim walkways to the far corner to find two giant Medusa heads — one on its side, one upside down — reused blocks whose story no one can fully explain. It even had a cameo in the James Bond film From Russia with Love.",
    address: "Alemdar, Yerebatan Cd. 1/3, Fatih",
    latitude: 41.008411,
    longitude: 28.977807,
    rating: 5,
    tags: ["byzantine", "underground", "medusa"],
  },
  {
    name: "Süleymaniye Mosque",
    category: "sight",
    description:
      "Crowning Istanbul's Third Hill, this is the masterpiece of Mimar Sinan, the greatest of Ottoman architects, finished in 1557 for Süleyman the Magnificent. Serene, luminous and perfectly proportioned, it feels a world calmer than the tourist-thronged mosques of Sultanahmet. In the garden behind it, the tombs of Süleyman and his powerful wife Hürrem (Roxelana) rest side by side, and the terrace serves up one of the finest views over the Golden Horn.",
    address: "Süleymaniye, Prof. Sıddık Sami Onar Cd. No:1, Fatih",
    latitude: 41.01603,
    longitude: 28.96392,
    rating: 5,
    tags: ["mosque", "sinan", "viewpoint"],
  },
  {
    name: "Chora Church (Kariye Mosque)",
    category: "sight",
    description:
      "Tucked into a quiet corner near the old land walls, the Chora holds what many consider the finest Byzantine mosaics and frescoes anywhere. Dating largely from the early 1300s, their shimmering gold scenes trace the lives of Christ and the Virgin Mary in astonishing, almost cinematic detail. Originally a church, later a mosque, then a museum, and a mosque again — its art has quietly survived it all.",
    address: "Dervişali, Kariye Cami Sk. No:18, Fatih",
    latitude: 41.03118,
    longitude: 28.93917,
    rating: 5,
    tags: ["byzantine", "mosaics", "frescoes"],
  },
  {
    name: "Dolmabahçe Palace",
    category: "sight",
    description:
      "When Topkapı began to feel old-fashioned, the sultans decamped in 1856 to this dazzling European-style palace right on the water's edge. Marble, gold leaf and crystal drip from every surface, culminating in a ballroom lit by the world's largest Bohemian chandelier. It was also where Mustafa Kemal Atatürk, founder of modern Turkey, died in 1938 — the palace clocks are famously stopped at 09:05 in his memory.",
    address: "Vişnezade, Dolmabahçe Cd., Beşiktaş",
    latitude: 41.03917,
    longitude: 29.00056,
    rating: 5,
    tags: ["palace", "ottoman", "bosphorus"],
  },
  {
    name: "Galata Tower",
    category: "sight",
    description:
      "This stout stone tower has watched over the city since the Genoese raised it in 1348 as the high point of their fortified colony. For centuries it served as a fire lookout, and legend even claims a 17th-century Ottoman aviator strapped on wings and glided from its top across the Golden Horn. Today a lift carries you to a 360-degree balcony with one of the best panoramas in Istanbul — save it for sunset.",
    address: "Bereketzade, Galata Kulesi, Beyoğlu",
    latitude: 41.02564,
    longitude: 28.97428,
    rating: 4,
    tags: ["tower", "viewpoint", "panorama"],
  },

  // ── Points of Interest ───────────────────────────────────────────────────
  {
    name: "Maiden's Tower (Kız Kulesi)",
    category: "poi",
    description:
      "Marooned on a tiny islet where the Bosphorus opens into the Sea of Marmara, this little tower has guarded the strait since antiquity. Turkish legend tells of a princess shut away here to escape a prophecy that she'd die by snakebite — only for the serpent to arrive hidden in a basket of fruit. Rebuilt many times over the centuries, it's now a café and viewpoint reached by a short boat ride from Üsküdar.",
    address: "Salacak, Üsküdar",
    latitude: 41.02111,
    longitude: 29.00417,
    rating: 4,
    tags: ["bosphorus", "legend", "viewpoint"],
  },
  {
    name: "Ortaköy Mosque",
    category: "poi",
    description:
      "Perched right at the water's edge beneath the soaring Bosphorus Bridge, this petite neo-Baroque mosque is one of the most photographed sights in the city. Finished in 1856, its tall windows were designed to catch the shifting light off the water. The lively square around it is the spot to try kumpir — a gloriously overloaded baked potato — and watch the ferries slide past.",
    address: "Mecidiye, Mecidiye Köprüsü Sk. No:1, Ortaköy, Beşiktaş",
    latitude: 41.04756,
    longitude: 29.02669,
    rating: 4,
    tags: ["mosque", "bosphorus", "photo-spot"],
  },
  {
    name: "Gülhane Park",
    category: "poi",
    description:
      "Once the private rose garden of Topkapı Palace, Gülhane is the oldest public park in Istanbul and a leafy escape from the crowds. Each April it erupts with tulips during the city's tulip festival — a flower Istanbul was cultivating long before it reached Holland. Shady paths, tea gardens and a Roman-era column make it a lovely place to slow the pace.",
    address: "Cankurtaran, Kennedy Cd., Fatih",
    latitude: 41.01333,
    longitude: 28.98167,
    rating: 4,
    tags: ["park", "tulips", "free"],
  },
  {
    name: "Pierre Loti Hill",
    category: "poi",
    description:
      "Named after a 19th-century French naval officer and novelist who fell hard for Istanbul and lingered at a café up here, this hilltop above Eyüp serves up a classic view down the Golden Horn. A short cable car glides up over a hillside cemetery shaded by cypress trees. Order a tulip glass of çay and settle in — it's especially magical toward sunset.",
    address: "Merkez, Balmumcu Sk., Eyüpsultan",
    latitude: 41.05278,
    longitude: 28.93361,
    rating: 4,
    tags: ["viewpoint", "cable-car", "cafe"],
  },

  // ── Experiences ──────────────────────────────────────────────────────────
  {
    name: "Bosphorus Cruise (Eminönü piers)",
    category: "experience",
    description:
      "No trip to Istanbul is complete without seeing it from the water. Ferries glide up the strait that splits Europe from Asia, past Ottoman palaces, the wooden waterfront mansions known as yalı, and the mighty Rumeli Fortress. The public ferries from Eminönü are cheap and wonderful — go at golden hour and let the skyline of domes and minarets drift by.",
    address: "Rüstem Paşa, Eminönü ferry piers, Fatih",
    latitude: 41.0175,
    longitude: 28.9725,
    rating: 5,
    tags: ["must-see", "cruise", "bosphorus", "sunset"],
  },
  {
    name: "Çemberlitaş Hamamı",
    category: "experience",
    description:
      "Steam away the day in one of the city's most beautiful bathhouses, designed in 1584 by the master architect Mimar Sinan. Beneath a marble dome pierced with star-shaped skylights, you'll be scrubbed, soaped and rinsed in a ritual that has barely changed in centuries. It's touristy but genuinely historic — the perfect antidote to a day pounding the cobbles.",
    address: "Molla Fenari, Vezirhan Cd. No:8, Fatih",
    latitude: 41.00806,
    longitude: 28.97056,
    rating: 4,
    tags: ["hamam", "spa", "historic"],
  },
  {
    name: "Whirling Dervishes (Hodjapasha)",
    category: "experience",
    description:
      "Part dance, part prayer, the sema ceremony of the Mevlevi order is mesmerising to witness. Dressed in white robes and tall felt hats, the dervishes spin into a meditative trance meant to represent the soul's journey toward the divine. Performances take place in a beautifully restored 550-year-old Ottoman bathhouse near Sirkeci — book ahead, and remember it's a spiritual rite rather than a show.",
    address: "Hobyar, Hocapaşa Hamamı Sk. No:3/B, Sirkeci, Fatih",
    latitude: 41.01472,
    longitude: 28.9775,
    rating: 4,
    tags: ["sufi", "sema", "culture"],
  },

  // ── Shopping ─────────────────────────────────────────────────────────────
  {
    name: "Grand Bazaar (Kapalıçarşı)",
    category: "shopping",
    description:
      "One of the oldest and largest covered markets on earth, the Kapalıçarşı began under Mehmet the Conqueror in the 1450s and grew into a labyrinth of some 60 streets and 4,000 shops. Carpets, lamps, gold, ceramics and endless glasses of tea change hands beneath painted vaulted ceilings. Getting pleasantly lost is half the fun — just be ready to haggle.",
    address: "Beyazıt, Kalpakçılar Cd. No:22, Fatih",
    latitude: 41.01076,
    longitude: 28.96806,
    rating: 5,
    tags: ["must-see", "bazaar", "carpets", "historic"],
  },
  {
    name: "Spice Bazaar (Mısır Çarşısı)",
    category: "shopping",
    description:
      "Follow your nose into this fragrant, L-shaped market, built in the 1660s to help fund the New Mosque next door. Mounds of saffron and sumac, pyramids of Turkish delight, dried fruit, nuts, teas and honeycomb spill from every stall. Locals still shop the side streets for coffee and cheese — sample generously before you commit.",
    address: "Rüstem Paşa, Erzak Ambarı Sk. No:92, Fatih",
    latitude: 41.01656,
    longitude: 28.97071,
    rating: 4,
    tags: ["bazaar", "spices", "turkish-delight"],
  },
  {
    name: "İstiklal Avenue",
    category: "shopping",
    description:
      "Istanbul's most famous promenade runs for more than a kilometre through Beyoğlu, from Taksim Square down toward Galata. A nostalgic red tram trundles along the middle past grand 19th-century facades, while the side alleys hide meyhanes, record shops and live-music bars. Day or night it's a river of people — join the flow and dive into the passages for baklava and street food.",
    address: "İstiklal Cd., Beyoğlu",
    latitude: 41.03361,
    longitude: 28.9775,
    rating: 4,
    tags: ["street", "shopping", "nightlife"],
  },

  // ── Restaurants ──────────────────────────────────────────────────────────
  {
    name: "Çiya Sofrası",
    category: "restaurant",
    description:
      "A pilgrimage spot for food lovers on the Kadıköy market streets, Çiya celebrates the regional home cooking of Anatolia — dishes you'll rarely find on a tourist menu. Point at the day's meze and slow-cooked stews at the counter, or order kebabs built around unexpected herbs and fruits. Simple, seasonal and deeply satisfying.",
    address: "Caferağa, Güneşli Bahçe Sk. No:43, Kadıköy",
    latitude: 40.99056,
    longitude: 29.02694,
    rating: 5,
    tags: ["anatolian", "meze", "local"],
  },
  {
    name: "Karaköy Güllüoğlu",
    category: "restaurant",
    description:
      "This dockside institution has been perfecting baklava since 1949, and plenty of Istanbulites will tell you it's the best in the city. Order at the counter and eat standing with a Turkish coffee — the pistachio and walnut layers are impossibly flaky. A sweet, quick stop right by the Karaköy ferries.",
    address: "Kemankeş Karamustafa Paşa, Rıhtım Cd. No:3-4, Beyoğlu",
    latitude: 41.02444,
    longitude: 28.97778,
    rating: 5,
    tags: ["baklava", "dessert", "since-1949"],
  },
  {
    name: "Mikla",
    category: "restaurant",
    description:
      "On a rooftop high above Beyoğlu, chef Mehmet Gürs pairs sweeping skyline views with 'new Anatolian' cooking that blends Turkish ingredients and Scandinavian precision. It's a splurge and a special-occasion favourite — come for sunset drinks on the terrace even if you don't stay for the full tasting menu.",
    address: "The Marmara Pera, Meşrutiyet Cd. No:15, Beyoğlu",
    latitude: 41.03083,
    longitude: 28.97444,
    rating: 5,
    tags: ["fine-dining", "rooftop", "view"],
  },

  // ── Hotels & Stays ───────────────────────────────────────────────────────
  {
    name: "Pera Palace Hotel",
    category: "hotel",
    description:
      "Built in 1892 to pamper passengers stepping off the Orient Express, the Pera Palace introduced Istanbul to electric lifts and grand European luxury. Agatha Christie is said to have written here, and Atatürk kept a room that is now a little museum. Even if you're not staying, step in for afternoon tea beneath the glass-domed lounge.",
    address: "Asmalı Mescit, Meşrutiyet Cd. No:52, Beyoğlu",
    latitude: 41.0317,
    longitude: 28.9744,
    rating: 5,
    tags: ["historic", "luxury", "orient-express"],
  },
  {
    name: "Four Seasons Istanbul at Sultanahmet",
    category: "hotel",
    description:
      "One of the city's most distinctive luxury hotels occupies a striking early-1900s neoclassical building — once a prison — barely a two-minute stroll from Hagia Sophia and the Blue Mosque. Its calm courtyard restaurant is a serene retreat in the very heart of the old city.",
    address: "Cankurtaran, Tevkifhane Sk. No:1, Fatih",
    latitude: 41.00869,
    longitude: 28.98056,
    rating: 5,
    tags: ["luxury", "sultanahmet"],
  },
  {
    name: "Çırağan Palace Kempinski",
    category: "hotel",
    description:
      "A restored 19th-century Ottoman palace on the Bosphorus, now a five-star hotel famous for its waterfront infinity pool. Even non-guests can book afternoon tea or a drink on the terrace and soak up the same view the sultans once enjoyed.",
    address: "Çırağan, Çırağan Cd. No:32, Beşiktaş",
    latitude: 41.04306,
    longitude: 29.01389,
    rating: 5,
    tags: ["palace", "luxury", "bosphorus"],
  },

  // ── Galataport & Karaköy (European shore, modern waterfront) ─────────────
  {
    name: "Galataport Istanbul",
    category: "poi",
    description:
      "A sleek, mile-long stretch of reclaimed waterfront in Karaköy, Galataport reopened the shore to the public in 2021 with a clever underground cruise terminal that keeps the promenade clear. Today it's lined with restaurants, cafés, boutiques and the Istanbul Modern art museum — a breezy place to stroll right beside the Bosphorus.",
    address: "Kemankeş Karamustafa Paşa, Karaköy, Beyoğlu",
    latitude: 41.0243,
    longitude: 28.982,
    rating: 4,
    tags: ["waterfront", "cafes", "shopping", "modern"],
  },
  {
    name: "Novikov Istanbul (Galataport)",
    category: "restaurant",
    description:
      "A glossy outpost of the international Novikov group set right on the Galataport waterfront. Expect a see-and-be-seen crowd, polished service and a menu that roams from Asian to Mediterranean — best enjoyed at a table by the water.",
    address: "Galataport, Karaköy, Beyoğlu",
    latitude: 41.0242,
    longitude: 28.9827,
    rating: 4,
    tags: ["modern", "upscale", "waterfront"],
  },
  {
    name: "Karaköy backstreets (bars)",
    category: "experience",
    description:
      "Behind Karaköy's cafés, a warren of narrow lanes fills after dark with tiny bars, cocktail spots and live music. It's one of the most fun corners of the European side for a bar crawl — just wander and see where the night takes you.",
    address: "Kemankeş Karamustafa Paşa, Karaköy, Beyoğlu",
    latitude: 41.0236,
    longitude: 28.9768,
    rating: 4,
    tags: ["bars", "nightlife", "cocktails"],
  },
  {
    name: "Unter",
    category: "restaurant",
    description:
      "A stylish Karaköy corner spot that shifts effortlessly from weekend brunch to late-night drinks. Industrial-chic and reliably good, it makes a handy anchor for exploring the district's backstreets.",
    address: "Kemankeş Karamustafa Paşa, Kara Ali Kaptan Sk. No:4, Karaköy",
    latitude: 41.024,
    longitude: 28.9762,
    rating: 4,
    tags: ["bistro", "bar", "brunch"],
  },

  // ── İstiklal / Beyoğlu ───────────────────────────────────────────────────
  {
    name: "Ficcin",
    category: "restaurant",
    description:
      "A long-running favourite tucked just off İstiklal, Ficcin made its name on Circassian mantı — delicate dumplings under garlicky yoghurt — alongside hearty Anatolian home cooking. Unpretentious, affordable and nearly always busy.",
    address: "Kallavi Sk. No:7, Beyoğlu (off İstiklal)",
    latitude: 41.0348,
    longitude: 28.9782,
    rating: 4,
    tags: ["circassian", "local", "casual"],
  },

  // ── Beşiktaş (incl. Serencebey) ──────────────────────────────────────────
  {
    name: "Serencebey (cafés & restaurants)",
    category: "poi",
    description:
      "A quiet, leafy pocket of Beşiktaş perched above the waterfront, Serencebey trades tourist bustle for neighbourhood cafés and easygoing restaurants. A nice detour if you want to see how locals actually live.",
    address: "Serencebey, Beşiktaş",
    latitude: 41.0452,
    longitude: 29.0072,
    rating: 4,
    tags: ["cafes", "quiet", "besiktas"],
  },
  {
    name: "Beşiktaş Fish Market",
    category: "restaurant",
    description:
      "Around Beşiktaş's covered fish market, a cluster of meyhanes and seafood grills serve the day's catch with meze and rakı. Lively, local and great value — pull up a stool and join the after-work crowd.",
    address: "Beşiktaş Çarşı, Balık Pazarı, Beşiktaş",
    latitude: 41.0428,
    longitude: 29.0065,
    rating: 4,
    tags: ["seafood", "meze", "meyhane"],
  },

  // ── Bebek (Bosphorus) ────────────────────────────────────────────────────
  {
    name: "Bebek Bay (seaside walk)",
    category: "poi",
    description:
      "Bebek is where well-heeled Istanbul comes to promenade — a graceful Bosphorus neighbourhood with a little waterfront park and a bay full of bobbing boats. Grab a coffee and walk the shore for some of the prettiest strait views in the whole city.",
    address: "Bebek, Beşiktaş",
    latitude: 41.0776,
    longitude: 29.0433,
    rating: 5,
    tags: ["bosphorus", "walk", "waterfront"],
  },
  {
    name: "Mangerie Bebek",
    category: "restaurant",
    description:
      "A beloved all-day café tucked upstairs in Bebek, known for long, lazy brunches with a slice of Bosphorus view. Come hungry, order too much, and settle in for a while.",
    address: "Cevdet Paşa Cd. No:69, Bebek, Beşiktaş",
    latitude: 41.0779,
    longitude: 29.0428,
    rating: 5,
    tags: ["brunch", "modern", "view"],
  },

  // ── Anatolian side: Moda & Kadıköy ───────────────────────────────────────
  {
    name: "Moda Seaside (Moda Sahili)",
    category: "poi",
    description:
      "On the Anatolian side, Moda's grassy seafront is where Kadıköy comes to breathe — a favourite for sunset picnics looking back across the water toward the old city's domes. Grab a tea from a passing samovar cart and watch the light change over the Marmara.",
    address: "Moda, Kadıköy",
    latitude: 40.9786,
    longitude: 29.0264,
    rating: 5,
    tags: ["seaside", "walk", "sunset", "anatolian"],
  },
  {
    name: "Moda Çay Bahçesi",
    category: "experience",
    description:
      "A classic seaside tea garden at the tip of Moda, all sea breeze and clinking tulip glasses. Order çay and a simit, claim a table by the water and do exactly as the locals do — which is to say, very little.",
    address: "Ferit Tek Sk., Moda, Kadıköy",
    latitude: 40.977,
    longitude: 29.0258,
    rating: 4,
    tags: ["tea-garden", "view", "local", "anatolian"],
  },
  {
    name: "Aleatico (Moda)",
    category: "restaurant",
    description:
      "An intimate wine bar and bistro in the heart of Moda, pouring natural wines alongside seasonal small plates. A relaxed spot to dip into the Anatolian side's buzzy, creative dining scene.",
    address: "Moda Cd., Moda, Kadıköy",
    latitude: 40.984,
    longitude: 29.027,
    rating: 4,
    tags: ["wine-bar", "bistro", "modern", "anatolian"],
  },
  {
    name: "Kadıköy Rıhtım",
    category: "poi",
    description:
      "The ferry quays of Kadıköy are the front door to Istanbul's Asian side — buzzing, unpretentious and full of life. It's the city's favourite meeting point and the jumping-off spot for the market streets just behind.",
    address: "Rıhtım Cd., Kadıköy",
    latitude: 40.9922,
    longitude: 29.0225,
    rating: 4,
    tags: ["ferry", "waterfront", "anatolian"],
  },
  {
    name: "Kadıköy Çarşı (market)",
    category: "experience",
    description:
      "The market streets behind the Kadıköy quay are a food-lover's playground: coffee roasters, fishmongers, sweet shops and meyhanes packed into a walkable grid. Come hungry and graze your way through some of the Anatolian side's best bites.",
    address: "Osmanağa, Kadıköy Çarşısı, Kadıköy",
    latitude: 40.9903,
    longitude: 29.027,
    rating: 5,
    tags: ["market", "food", "meyhane", "anatolian"],
  },
  {
    name: "Baylan Pastanesi (Kadıköy)",
    category: "restaurant",
    description:
      "A nostalgic Kadıköy patisserie serving since the mid-20th century, Baylan is famous for its Kup Griye — a caramel-and-ice-cream sundae that locals have loved for generations. A sweet slice of old Istanbul.",
    address: "Caferağa, Moda Cd. No:19, Kadıköy",
    latitude: 40.9906,
    longitude: 29.0293,
    rating: 4,
    tags: ["patisserie", "dessert", "historic", "anatolian"],
  },

  // ── Golden Horn: Fener, Balat & Eyüp ─────────────────────────────────────
  {
    name: "Fener & Balat",
    category: "poi",
    description:
      "Two of Istanbul's oldest and most colourful neighbourhoods, Fener and Balat tumble down the hills along the Golden Horn. For centuries this was home to the city's Greek, Jewish and Armenian communities, and their churches, synagogues and the Greek Orthodox Patriarchate still stand among steep lanes of rainbow-painted houses, antique shops and tucked-away cafés. It's a corner of the city made for aimless wandering and photographs.",
    address: "Balat & Fener, Fatih",
    latitude: 41.0292,
    longitude: 28.9498,
    rating: 4,
    tags: ["neighbourhood", "colourful", "historic", "golden-horn"],
  },
  {
    name: "Eyüp Sultan Mosque",
    category: "sight",
    description:
      "One of the holiest sites in Turkey, this mosque grew up around the tomb of Abu Ayyub al-Ansari, a companion and standard-bearer of the Prophet Muhammad who died here during the 7th-century Arab siege of Constantinople. The graceful baroque mosque you see today dates to 1800, and its tile-lined courtyards fill with pilgrims — Ottoman sultans were once girded with the sword of Osman on this very spot. From here a cable car climbs to the Pierre Loti café for sweeping views down the Golden Horn.",
    address: "Merkez, Camii Kebir Sk., Eyüpsultan",
    latitude: 41.0478,
    longitude: 28.9337,
    rating: 4,
    tags: ["mosque", "pilgrimage", "ottoman", "golden-horn"],
  },
];

async function main() {
  const usingGoogle = Boolean(
    process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID,
  );
  console.log(
    `Image source: ${usingGoogle ? "Google Custom Search API" : "Openverse (keyless)"}\n`,
  );

  // One-time rename: the Basilica Cistern is the Yerebatan Sarnıcı (same place).
  await prisma.pin.updateMany({
    where: { name: "Basilica Cistern" },
    data: { name: "Basilica Cistern (Yerebatan Sarnıcı)" },
  });

  let created = 0;
  let updated = 0;

  for (let i = 0; i < ISTANBUL_PINS.length; i++) {
    const pin = ISTANBUL_PINS[i];
    const images = await fetchImages(queryFor(pin), 5);
    await sleep(500); // be polite to the image API
    const existing = await prisma.pin.findFirst({ where: { name: pin.name } });

    if (existing) {
      const data = { description: pin.description };
      if (images.length) {
        data.images = images;
        data.imageUrl = images[0];
      } else if (!existing.imageUrl) {
        data.imageUrl = photoFor(pin.category, i + 1);
        data.images = [];
      }
      await prisma.pin.update({ where: { id: existing.id }, data });
      updated += 1;
      console.log(
        `↻ ${pin.name} ${images.length ? `(${images.length} photos)` : "(text only)"}`,
      );
    } else {
      const imageUrl = images[0] ?? photoFor(pin.category, i + 1);
      await prisma.pin.create({ data: { ...pin, imageUrl, images } });
      created += 1;
      console.log(`✓ added  ${pin.name} (${images.length} photos)`);
    }
  }

  console.log(`\nDone — ${created} created, ${updated} updated.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
