// Seeds the database with a curated set of Istanbul's most-visited places.
//
// Run with:  npm run db:seed   (loads .env via the Prisma CLI, then executes this)
//
// These are inserted as ordinary, fully editable pins — you can rename, move,
// re-rate, or delete any of them from the app afterwards. The script is
// idempotent: any pin whose `name` already exists is skipped, so re-running it
// will not create duplicates.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Topical placeholder photos, deterministic per pin via ?lock. Swap any of these
// for a real photo from the app's edit form (the "Photo URL" field).
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

// Real photos: map a pin name -> Wikipedia article title. We pull the lead photo
// plus a few gallery shots from Wikimedia (properly licensed) at seed time.
const WIKI_TITLES = {
  "Hagia Sophia": "Hagia Sophia",
  "Blue Mosque (Sultan Ahmed Mosque)": "Sultan Ahmed Mosque",
  "Topkapı Palace": "Topkapı Palace",
  "Basilica Cistern (Yerebatan Sarnıcı)": "Basilica Cistern",
  "Süleymaniye Mosque": "Süleymaniye Mosque",
  "Chora Church (Kariye Mosque)": "Chora Church",
  "Dolmabahçe Palace": "Dolmabahçe Palace",
  "Galata Tower": "Galata Tower",
  "Maiden's Tower (Kız Kulesi)": "Maiden's Tower",
  "Ortaköy Mosque": "Ortaköy Mosque",
  "Gülhane Park": "Gülhane Park",
  "Bosphorus Cruise (Eminönü piers)": "Bosphorus",
  "Çemberlitaş Hamamı": "Çemberlitaş Hamamı",
  "Grand Bazaar (Kapalıçarşı)": "Grand Bazaar, Istanbul",
  "Spice Bazaar (Mısır Çarşısı)": "Spice Bazaar",
  "İstiklal Avenue": "İstiklal Avenue",
  "Pera Palace Hotel": "Pera Palace Hotel",
  "Çırağan Palace Kempinski": "Çırağan Palace",
  "Galataport Istanbul": "Galataport",
  "Bebek Bay (seaside walk)": "Bebek, Beşiktaş",
  "Kadıköy Rıhtım": "Kadıköy",
  "Kadıköy Çarşı (market)": "Kadıköy",
  "Moda Seaside (Moda Sahili)": "Moda, Kadıköy",
};

async function fetchWikiImages(title) {
  const out = [];
  const seen = new Set();
  const push = (u) => {
    if (!u) return;
    const key = (u.split("px-").pop() || u).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(u);
  };
  const enc = encodeURIComponent(title.replace(/ /g, "_"));
  const headers = {
    "user-agent": "TurkiyeTravelMap/1.0 (personal, non-commercial)",
    accept: "application/json",
  };
  const big = (u) => (u ? u.replace(/\/\d+px-/, "/1024px-") : u);

  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`,
      { headers },
    );
    if (r.ok) {
      const j = await r.json();
      push(big(j?.thumbnail?.source) || j?.originalimage?.source);
    }
  } catch {
    /* ignore */
  }

  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${enc}`,
      { headers },
    );
    if (r.ok) {
      const j = await r.json();
      for (const it of j?.items || []) {
        if (out.length >= 5) break;
        if (it.type !== "image" || !it.srcset || !it.srcset[0]) continue;
        let url = it.srcset[0].src;
        url = url.startsWith("//") ? "https:" + url : url;
        url = big(url);
        if (!/\.(jpe?g|png)(\?|$)/i.test(url)) continue;
        if (/(logo|icon|oojs|ambox|wiki_letter|question_book|edit-)/i.test(url))
          continue;
        push(url);
      }
    }
  } catch {
    /* ignore */
  }

  return out.slice(0, 5);
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
      "Sixth-century Byzantine basilica turned mosque and museum — Istanbul's most iconic landmark, crowned by a vast 55m dome.",
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
      "Sultan Ahmed's 17th-century imperial mosque, famed for its six minarets and more than 20,000 hand-painted İznik tiles.",
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
      "Opulent seat of the Ottoman sultans for 400 years, with the Harem, the imperial treasury, and sweeping Bosphorus views.",
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
      "Atmospheric underground Byzantine water cistern with 336 columns and the famous upside-down Medusa heads.",
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
      "Mimar Sinan's masterpiece crowning the Third Hill, with serene courtyards and panoramic views over the Golden Horn.",
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
      "Byzantine church holding some of the world's finest medieval mosaics and frescoes depicting the life of Christ.",
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
      "Lavish 19th-century waterfront palace blending Ottoman and European style, home to the world's largest Bohemian crystal chandelier.",
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
      "Medieval Genoese stone tower with a 360° observation deck over the old city, the Golden Horn, and the Bosphorus.",
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
      "Tiny islet tower off Üsküdar steeped in legend, now a café and viewpoint in the middle of the Bosphorus.",
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
      "Neo-baroque waterfront mosque framed by the Bosphorus Bridge — one of Istanbul's most photographed spots.",
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
      "Historic imperial rose garden beside Topkapı Palace, bursting with tulips each spring.",
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
      "Hilltop café in Eyüp reached by a short cable-car ride, with a classic view down the Golden Horn.",
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
      "Ferry cruise between two continents past palaces, fortresses, and waterfront mansions — best at sunset.",
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
      "Historic 1584 Turkish bath designed by Mimar Sinan, offering a traditional scrub-and-steam ritual.",
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
      "Sema ceremony of the Mevlevi order performed nightly in a restored 550-year-old Ottoman bathhouse.",
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
      "One of the world's oldest and largest covered markets, with 4,000 shops of carpets, lamps, jewelry, and more.",
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
      "Fragrant L-shaped market piled with Turkish delight, teas, dried fruits, and mounds of colorful spices.",
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
      "Bustling 1.4km pedestrian boulevard of shops and cafés, with a vintage red tram running from Taksim to Tünel.",
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
      "Beloved Kadıköy restaurant celebrating regional Anatolian home cooking, kebabs, and seasonal meze.",
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
      "Istanbul's most famous baklava house, serving flaky pistachio pastries since 1949.",
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
      "Rooftop fine-dining destination pairing modern Anatolian–Scandinavian cuisine with sweeping skyline views.",
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
      "Grand 1892 hotel built for Orient Express travelers, favored by Agatha Christie and Atatürk.",
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
      "Luxury hotel in a converted neoclassical building steps from Hagia Sophia and the Blue Mosque.",
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
      "Restored Ottoman palace on the Bosphorus with an iconic infinity pool and waterfront suites.",
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
      "Sleek revamped waterfront quarter along the Bosphorus with cafés, restaurants, shops and a cruise terminal.",
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
      "Glossy international restaurant at Galataport serving Asian and Mediterranean plates right by the water.",
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
      "Warren of lively lanes behind Karaköy packed with cocktail bars and late-night spots.",
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
      "Cool Karaköy bistro and bar that runs from weekend brunch through to evening drinks.",
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
      "Long-running favourite just off İstiklal for hearty Circassian mantı and Anatolian home cooking.",
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
      "Quiet, leafy hilltop pocket of Beşiktaş dotted with neighbourhood cafés and restaurants.",
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
      "Cluster of meyhanes and seafood spots around the buzzing Beşiktaş fish market.",
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
      "Elegant Bosphorus neighbourhood with a waterfront park and promenade made for strolling.",
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
      "Beloved all-day Bebek brunch spot tucked above the shore with Bosphorus views.",
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
      "Grassy Anatolian-side promenade and a favourite sunset perch over the Marmara Sea.",
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
      "Historic seaside tea garden in Moda, perfect for çay and simit right by the water.",
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
      "Intimate Moda wine bar and bistro pairing natural wines with seasonal small plates.",
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
      "Buzzing ferry-pier waterfront on the Anatolian side and Kadıköy's favourite meeting point.",
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
      "Historic market streets brimming with coffee roasters, meyhanes, sweet shops and street food.",
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
      "Nostalgic Kadıköy patisserie since 1961, famous for its legendary Kup Griye sundae.",
    address: "Caferağa, Moda Cd. No:19, Kadıköy",
    latitude: 40.9906,
    longitude: 29.0293,
    rating: 4,
    tags: ["patisserie", "dessert", "historic", "anatolian"],
  },
];

async function main() {
  // One-time rename: the Basilica Cistern is the Yerebatan Sarnıcı (same place),
  // so fold any earlier "Basilica Cistern" pin into the new combined name.
  await prisma.pin.updateMany({
    where: { name: "Basilica Cistern" },
    data: { name: "Basilica Cistern (Yerebatan Sarnıcı)" },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < ISTANBUL_PINS.length; i++) {
    const pin = ISTANBUL_PINS[i];
    const title = WIKI_TITLES[pin.name];
    const images = title ? await fetchWikiImages(title) : [];
    const imageUrl = images[0] ?? photoFor(pin.category, i + 1);
    const existing = await prisma.pin.findFirst({ where: { name: pin.name } });

    if (existing) {
      if (images.length) {
        // Upgrade placeholder -> real licensed photos.
        await prisma.pin.update({
          where: { id: existing.id },
          data: { imageUrl, images },
        });
        updated += 1;
        console.log(`↻ photos ${pin.name} (${images.length})`);
      } else if (!existing.imageUrl) {
        await prisma.pin.update({
          where: { id: existing.id },
          data: { imageUrl, images: [] },
        });
        updated += 1;
        console.log(`↻ image  ${pin.name}`);
      } else {
        skipped += 1;
        console.log(`↷ skip   ${pin.name}`);
      }
      continue;
    }

    await prisma.pin.create({ data: { ...pin, imageUrl, images } });
    created += 1;
    console.log(`✓ added  ${pin.name}`);
  }

  console.log(
    `\nDone — ${created} created, ${updated} updated, ${skipped} skipped, ${ISTANBUL_PINS.length} total.`,
  );
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
