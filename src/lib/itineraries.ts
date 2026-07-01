// Curated 5-day Istanbul itineraries, classified by intensity.
//
// Synthesised from several published Istanbul itineraries (Rick Steves,
// itsalltriptome, goaskalocal, thegonegoat, flypgs, blainebonham, kimkim) —
// rewritten in our own words. `pin` values match a seeded Pin's `name` so the
// UI can fly the map to that place; stops without a `pin` are shown as plain text.

export type ItineraryLevel = "Relaxed" | "Classic" | "Packed";

export interface ItineraryStop {
  name: string;
  /** Exact Pin.name to link this stop to a map pin, if we have one. */
  pin?: string;
  note?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  area: string;
  stops: ItineraryStop[];
}

export interface Itinerary {
  id: string;
  name: string;
  level: ItineraryLevel;
  emoji: string;
  tagline: string;
  days: ItineraryDay[];
}

export const ITINERARY_LEVELS: Record<
  ItineraryLevel,
  { label: string; color: string; blurb: string }
> = {
  Relaxed: {
    label: "Relaxed",
    color: "#10b981",
    blurb: "Slow travel — a few highlights a day, long lunches, lots of tea.",
  },
  Classic: {
    label: "Classic",
    color: "#3b82f6",
    blurb: "The balanced first-timer route — all the icons at a steady pace.",
  },
  Packed: {
    label: "Packed",
    color: "#ef4444",
    blurb: "Maximum Istanbul — early starts and full days, see it all.",
  },
};

export const ITINERARIES: Itinerary[] = [
  {
    id: "relaxed-5",
    name: "Istanbul, Unhurried",
    level: "Relaxed",
    emoji: "🍵",
    tagline: "5 easy days — sights in the morning, sea breeze in the afternoon.",
    days: [
      {
        day: 1,
        title: "Sultanahmet, gently",
        area: "Old City",
        stops: [
          { name: "Hagia Sophia", pin: "Hagia Sophia", note: "Go early, before the crowds." },
          { name: "Blue Mosque", pin: "Blue Mosque (Sultan Ahmed Mosque)", note: "Just across the park." },
          { name: "Gülhane Park", pin: "Gülhane Park", note: "Shady stroll to reset." },
          { name: "Çemberlitaş Hamamı", pin: "Çemberlitaş Hamamı", note: "Optional evening soak." },
        ],
      },
      {
        day: 2,
        title: "Markets & mosques",
        area: "Old City",
        stops: [
          { name: "Süleymaniye Mosque", pin: "Süleymaniye Mosque", note: "Best Golden Horn view." },
          { name: "Grand Bazaar", pin: "Grand Bazaar (Kapalıçarşı)" },
          { name: "Spice Bazaar", pin: "Spice Bazaar (Mısır Çarşısı)", note: "Downhill toward Eminönü." },
        ],
      },
      {
        day: 3,
        title: "Slow day on the Asian side",
        area: "Kadıköy & Moda",
        stops: [
          { name: "Kadıköy Rıhtım", pin: "Kadıköy Rıhtım", note: "Ferry across from Eminönü." },
          { name: "Kadıköy Çarşı", pin: "Kadıköy Çarşı (market)", note: "Graze through the food streets." },
          { name: "Çiya Sofrası", pin: "Çiya Sofrası", note: "Long Anatolian lunch." },
          { name: "Moda Seaside", pin: "Moda Seaside (Moda Sahili)", note: "Sunset on the grass." },
        ],
      },
      {
        day: 4,
        title: "Bosphorus & Bebek",
        area: "The strait",
        stops: [
          { name: "Bosphorus Cruise", pin: "Bosphorus Cruise (Eminönü piers)", note: "Two continents by ferry." },
          { name: "Bebek Bay", pin: "Bebek Bay (seaside walk)" },
          { name: "Mangerie Bebek", pin: "Mangerie Bebek", note: "Brunch with a view." },
        ],
      },
      {
        day: 5,
        title: "Beyoğlu wander",
        area: "Beyoğlu",
        stops: [
          { name: "İstiklal Avenue", pin: "İstiklal Avenue", note: "Ride the nostalgic tram." },
          { name: "Galata Tower", pin: "Galata Tower", note: "Save it for sunset." },
          { name: "Karaköy Güllüoğlu", pin: "Karaköy Güllüoğlu", note: "Farewell baklava." },
        ],
      },
    ],
  },
  {
    id: "classic-5",
    name: "The Classic Five",
    level: "Classic",
    emoji: "🕌",
    tagline: "Every Istanbul icon at a steady, first-timer pace.",
    days: [
      {
        day: 1,
        title: "The historic core",
        area: "Sultanahmet",
        stops: [
          { name: "Hagia Sophia", pin: "Hagia Sophia" },
          { name: "Blue Mosque", pin: "Blue Mosque (Sultan Ahmed Mosque)" },
          { name: "Basilica Cistern (Yerebatan)", pin: "Basilica Cistern (Yerebatan Sarnıcı)" },
          { name: "Hippodrome of Constantinople", note: "Obelisks between the mosques." },
          { name: "Whirling Dervishes", pin: "Whirling Dervishes (Hodjapasha)", note: "Evening sema ceremony." },
        ],
      },
      {
        day: 2,
        title: "Palace & bazaars",
        area: "Old City",
        stops: [
          { name: "Topkapı Palace", pin: "Topkapı Palace", note: "Don't skip the Harem." },
          { name: "Gülhane Park", pin: "Gülhane Park" },
          { name: "Süleymaniye Mosque", pin: "Süleymaniye Mosque" },
          { name: "Grand Bazaar", pin: "Grand Bazaar (Kapalıçarşı)" },
          { name: "Spice Bazaar", pin: "Spice Bazaar (Mısır Çarşısı)" },
        ],
      },
      {
        day: 3,
        title: "Beyoğlu & the Bosphorus",
        area: "Beyoğlu",
        stops: [
          { name: "İstiklal Avenue", pin: "İstiklal Avenue" },
          { name: "Galata Tower", pin: "Galata Tower" },
          { name: "Galataport", pin: "Galataport Istanbul", note: "Waterfront lunch." },
          { name: "Bosphorus Cruise", pin: "Bosphorus Cruise (Eminönü piers)" },
          { name: "Ortaköy Mosque", pin: "Ortaköy Mosque", note: "Kumpir by the bridge." },
        ],
      },
      {
        day: 4,
        title: "Asian side",
        area: "Kadıköy & Üsküdar",
        stops: [
          { name: "Kadıköy Rıhtım", pin: "Kadıköy Rıhtım" },
          { name: "Kadıköy Çarşı", pin: "Kadıköy Çarşı (market)", note: "Food-tour territory." },
          { name: "Moda Seaside", pin: "Moda Seaside (Moda Sahili)" },
          { name: "Maiden's Tower", pin: "Maiden's Tower (Kız Kulesi)", note: "Seen from Üsküdar shore." },
        ],
      },
      {
        day: 5,
        title: "Golden Horn & Chora",
        area: "Fatih & Beşiktaş",
        stops: [
          { name: "Chora Church", pin: "Chora Church (Kariye Mosque)", note: "World-class mosaics." },
          { name: "Fener & Balat", note: "Colourful multicultural lanes." },
          { name: "Pierre Loti Hill", pin: "Pierre Loti Hill", note: "Cable car up for the view." },
          { name: "Dolmabahçe Palace", pin: "Dolmabahçe Palace", note: "Or a hamam to wind down." },
        ],
      },
    ],
  },
  {
    id: "packed-5",
    name: "Maximum Istanbul",
    level: "Packed",
    emoji: "⚡",
    tagline: "Early starts, full days — squeeze every drop out of five days.",
    days: [
      {
        day: 1,
        title: "Sultanahmet blitz",
        area: "Old City",
        stops: [
          { name: "Hagia Sophia", pin: "Hagia Sophia", note: "First entry slot." },
          { name: "Blue Mosque", pin: "Blue Mosque (Sultan Ahmed Mosque)" },
          { name: "Basilica Cistern (Yerebatan)", pin: "Basilica Cistern (Yerebatan Sarnıcı)" },
          { name: "Topkapı Palace", pin: "Topkapı Palace" },
          { name: "Gülhane Park", pin: "Gülhane Park" },
          { name: "Whirling Dervishes", pin: "Whirling Dervishes (Hodjapasha)" },
        ],
      },
      {
        day: 2,
        title: "Markets, mosques & Beyoğlu",
        area: "Old City → Beyoğlu",
        stops: [
          { name: "Süleymaniye Mosque", pin: "Süleymaniye Mosque" },
          { name: "Grand Bazaar", pin: "Grand Bazaar (Kapalıçarşı)" },
          { name: "Spice Bazaar", pin: "Spice Bazaar (Mısır Çarşısı)" },
          { name: "Galata Tower", pin: "Galata Tower" },
          { name: "İstiklal Avenue", pin: "İstiklal Avenue" },
          { name: "Ficcin", pin: "Ficcin", note: "Quick dinner off İstiklal." },
        ],
      },
      {
        day: 3,
        title: "The whole Bosphorus",
        area: "Beşiktaş & up the strait",
        stops: [
          { name: "Dolmabahçe Palace", pin: "Dolmabahçe Palace", note: "Open at 09:00." },
          { name: "Bosphorus Cruise", pin: "Bosphorus Cruise (Eminönü piers)" },
          { name: "Ortaköy Mosque", pin: "Ortaköy Mosque" },
          { name: "Bebek Bay", pin: "Bebek Bay (seaside walk)" },
          { name: "Beşiktaş Fish Market", pin: "Beşiktaş Fish Market", note: "Meyhane dinner." },
        ],
      },
      {
        day: 4,
        title: "Two continents in a day",
        area: "Kadıköy, Moda & Üsküdar",
        stops: [
          { name: "Kadıköy Rıhtım", pin: "Kadıköy Rıhtım" },
          { name: "Kadıköy Çarşı", pin: "Kadıköy Çarşı (market)" },
          { name: "Moda Çay Bahçesi", pin: "Moda Çay Bahçesi" },
          { name: "Moda Seaside", pin: "Moda Seaside (Moda Sahili)" },
          { name: "Maiden's Tower", pin: "Maiden's Tower (Kız Kulesi)" },
          { name: "Aleatico", pin: "Aleatico (Moda)", note: "Wine-bar nightcap." },
        ],
      },
      {
        day: 5,
        title: "Golden Horn deep cut",
        area: "Fatih & Eyüp",
        stops: [
          { name: "Chora Church", pin: "Chora Church (Kariye Mosque)" },
          { name: "Fener & Balat", note: "Antique shops and churches." },
          { name: "Eyüp Sultan", note: "Sacred mosque complex." },
          { name: "Pierre Loti Hill", pin: "Pierre Loti Hill" },
          { name: "Mikla", pin: "Mikla", note: "Rooftop farewell dinner." },
        ],
      },
    ],
  },
];
