import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in environment."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const USER_AGENT = "MiniMarketplaceSeeder/1.0 (https://localhost:3000)";

const SEED_LISTINGS = [
  {
    slug: "keychron-mechanical-keyboard",
    title: "Keychron Q1 Pro Wireless Mechanical Keyboard",
    description:
      "75% aluminum mechanical keyboard with hot-swappable tactile switches, PBT keycaps, and USB-C / Bluetooth connectivity. Lightly used on a home desk setup for 4 months—includes original braided cable and keycap puller.",
    price: 135,
    category: "Electronics",
    seller_email: "maya.lin.seller@example.com",
    location: "Austin, TX",
    hoursAgo: 2,
    imageQuery: "mechanical keyboard desk",
  },
  {
    slug: "sony-wireless-headphones",
    title: "Sony WH-1000XM5 Noise Cancelling Headphones",
    description:
      "Matte black over-ear wireless headphones with industry-leading ANC, multipoint Bluetooth, and 30-hour battery life. Comes with original hardshell carrying case and charging cable. Zero scratches on earcups.",
    price: 210,
    category: "Electronics",
    seller_email: "devon.brooks@example.com",
    location: "Seattle, WA",
    hoursAgo: 5,
    imageQuery: "wireless headphones black",
  },
  {
    slug: "fujifilm-mirrorless-camera",
    title: "Fujifilm X-T30 II Mirrorless Camera + 18-55mm Lens",
    description:
      "Compact APS-C mirrorless camera with classic dial controls and XF 18-55mm f/2.8-4 OIS zoom lens. Shutter count under 3,200. Includes two OEM batteries, charger, and leather neck strap.",
    price: 780,
    category: "Electronics",
    seller_email: "elena.rostova@example.com",
    location: "Brooklyn, NY",
    hoursAgo: 14,
    imageQuery: "mirrorless digital camera lens",
  },
  {
    slug: "specialized-road-bike",
    title: "Specialized Allez Sport Road Bike (54cm Frame)",
    description:
      "Lightweight E5 alloy frame with carbon fork and Shimano Sora 18-speed drivetrain. Recently tuned with fresh bar tape and Continental Gatorskin tires. Ideal for riders 5'7\" to 5'10\".",
    price: 540,
    category: "Vehicles",
    seller_email: "marcus.chen@example.com",
    location: "Portland, OR",
    hoursAgo: 8,
    imageQuery: "road bicycle aluminum frame",
  },
  {
    slug: "vespa-primavera-scooter",
    title: "2021 Vespa Primavera 150 Touring Scooter",
    description:
      "Clean title, 2,450 miles, garage-kept since day one. Smooth 155cc fuel-injected engine, front/rear chrome racks, and under-seat helmet storage. Fresh oil service completed last month.",
    price: 3450,
    category: "Vehicles",
    seller_email: "lucas.bennett@example.com",
    location: "San Diego, CA",
    hoursAgo: 28,
    imageQuery: "vespa scooter parked street",
  },
  {
    slug: "mid-century-oak-desk",
    title: "Mid-Century Solid White Oak Writing Desk",
    description:
      "Handcrafted solid oak desk (52\" W x 24\" D x 30\" H) with two smooth dovetail drawers and tapered legs. Finished in matte natural hardwax oil. Fits easily in a hatchback or SUV with legs detached.",
    price: 340,
    category: "Furniture",
    seller_email: "hannah.kim@example.com",
    location: "Chicago, IL",
    hoursAgo: 4,
    imageQuery: "wooden desk",
  },
  {
    slug: "boucle-accent-lounge-chair",
    title: "Cream Bouclé Swivel Lounge Chair",
    description:
      "Deep-seated accent armchair upholstered in textured ivory bouclé fabric on a matte walnut swivel base. From a pet-free, smoke-free apartment. Super comfortable for reading corners.",
    price: 265,
    category: "Furniture",
    seller_email: "noah.patel@example.com",
    location: "Denver, CO",
    hoursAgo: 19,
    imageQuery: "modern armchair living room",
  },
  {
    slug: "carhartt-canvas-jacket",
    title: "Carhartt WIP Detroit Canvas Work Jacket (Size M)",
    description:
      "Heavyweight 12oz organic Dearborn cotton canvas in tobacco brown with corduroy collar and blanket lining. Worn only a handful of times—crisp condition with zero stains or tears.",
    price: 115,
    category: "Clothing",
    seller_email: "owen.garcia@example.com",
    location: "Minneapolis, MN",
    hoursAgo: 11,
    imageQuery: "canvas work jacket brown",
  },
  {
    slug: "running-sneakers-pair",
    title: "New Balance 990v6 Made in USA Sneakers (US 10)",
    description:
      "Classic grey/castlerock colorway, US Men's 10D. Worn twice indoors on a treadmill—soles are practically spotless. Includes original box and extra white laces.",
    price: 130,
    category: "Clothing",
    seller_email: "chloe.adams@example.com",
    location: "Boston, MA",
    hoursAgo: 36,
    imageQuery: "running shoes",
  },
  {
    slug: "breville-espresso-machine",
    title: "Breville Barista Express Espresso Machine + Grinder",
    description:
      "Brushed stainless steel espresso machine with built-in conical burr grinder, PID temperature control, and steam wand. Descaled every 2 months and includes bottomless portafilter, tamper, and milk pitcher.",
    price: 425,
    category: "Home & Garden",
    seller_email: "sofia.martinez@example.com",
    location: "San Francisco, CA",
    hoursAgo: 3,
    imageQuery: "espresso machine",
  },
  {
    slug: "ceramic-planters-bundle",
    title: "Matte Ceramic Planter Trio with Healthy Snake Plants",
    description:
      "Set of three drainage-equipped ceramic pots (6\", 8\", and 10\") with matching bamboo saucers and thriving low-light Sansevieria plants. Pickup only so soil stays tidy.",
    price: 48,
    category: "Home & Garden",
    seller_email: "claire.wu@example.com",
    location: "Seattle, WA",
    hoursAgo: 22,
    imageQuery: "sansevieria potted plant",
  },
  {
    slug: "nintendo-switch-oled-bundle",
    title: "Nintendo Switch OLED White + Zelda Tears of the Kingdom",
    description:
      "Clean Nintendo Switch OLED console with dock, Joy-Con grip, HDMI/power cables, tempered glass screen protector installed, and physical cartridge of Tears of the Kingdom.",
    price: 260,
    category: "Toys & Games",
    seller_email: "ethan.cho@example.com",
    location: "Austin, TX",
    hoursAgo: 7,
    imageQuery: "nintendo switch handheld console",
  },
  {
    slug: "strategy-board-game-bundle",
    title: "Catan + Ticket to Ride + Azul Board Game Bundle",
    description:
      "All three classic strategy board games are 100% complete with every tile, card, and wooden piece counted and bagged. Great condition boxes—selling because we're downsizing before a move.",
    price: 55,
    category: "Toys & Games",
    seller_email: "rachel.green@example.com",
    location: "Chicago, IL",
    hoursAgo: 44,
    imageQuery: "settlers of catan board game",
  },
  {
    slug: "adjustable-dumbbell-pair",
    title: "Adjustable Cast Iron Dumbbell Set (5–52.5 lb Pair)",
    description:
      "Space-saving dial-select dumbbell pair with heavy-duty molded storage trays. Smooth weight plates from 5 to 52.5 lbs per hand. Perfect for apartment or garage workouts.",
    price: 220,
    category: "Sports & Outdoors",
    seller_email: "jordan.lee@example.com",
    location: "Denver, CO",
    hoursAgo: 6,
    imageQuery: "dumbbells gym weights fitness",
  },
  {
    slug: "camping-backpacking-tent",
    title: "REI Half Dome SL 2+ Backpacking Tent",
    description:
      "Ultralight 2-person 3-season tent with aluminum poles, full-coverage rainfly, footprint groundsheet, and stakes. Used on two dry weekend trips—no rips, clean zippers.",
    price: 175,
    category: "Sports & Outdoors",
    seller_email: "tessa.park@example.com",
    location: "Portland, OR",
    hoursAgo: 31,
    imageQuery: "camping tent outdoors mountains",
  },
  {
    slug: "classic-jazz-vinyl-records",
    title: "Classic Jazz Vinyl LP Collection (12 Records)",
    description:
      "Curated lot of 12 jazz vinyl LPs including Miles Davis, John Coltrane, Bill Evans, and Herbie Hancock. Sleeves are VG+ and vinyl plays cleanly without skips.",
    price: 140,
    category: "Books & Media",
    seller_email: "sam.keller@example.com",
    location: "Brooklyn, NY",
    hoursAgo: 16,
    imageQuery: "vinyl records turntable collection",
  },
  {
    slug: "polaroid-sx70-vintage-camera",
    title: "1970s Polaroid SX-70 Folding SLR Instant Camera",
    description:
      "Iconic brushed chrome and tan leather folding Polaroid SX-70. Film rollers cleaned, bellows light-tight, and tested with fresh SX-70 film pack. Includes original brown carrying case.",
    price: 195,
    category: "Collectibles",
    seller_email: "nina.kapoor@example.com",
    location: "Boston, MA",
    hoursAgo: 52,
    imageQuery: "polaroid sx-70",
  },
  {
    slug: "moving-boxes-packing-supplies",
    title: "25 Sturdy Medium Moving Boxes + Bubble Wrap Roll",
    description:
      "Flattened once-used cardboard moving boxes (18\" x 14\" x 12\") plus half a roll of packing paper and bubble wrap. Free to anyone moving soon—porch pickup anytime today.",
    price: 0,
    category: "Other",
    seller_email: "alex.rivera@example.com",
    location: "Austin, TX",
    hoursAgo: 1,
    imageQuery: "cardboard moving boxes stacked",
  },
];

async function findWikimediaImage(query) {
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("generator", "search");
  endpoint.searchParams.set("gsrnamespace", "6");
  endpoint.searchParams.set("gsrsearch", `${query} filetype:bitmap`);
  endpoint.searchParams.set("gsrlimit", "8");
  endpoint.searchParams.set("prop", "imageinfo");
  endpoint.searchParams.set("iiprop", "url|mime|size");
  endpoint.searchParams.set("iiurlwidth", "960");
  endpoint.searchParams.set("format", "json");

  const res = await fetch(endpoint, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Wikimedia search failed (${res.status}) for "${query}"`);
  }

  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {});
  const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

  // Sort by index so highest search relevance comes first
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || !allowedMimes.has(info.mime)) continue;
    if ((info.width ?? 0) < 400 || (info.height ?? 0) < 300) continue;
    const downloadUrl = info.thumburl || info.url;
    if (!downloadUrl) continue;

    try {
      const imgRes = await fetch(downloadUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!imgRes.ok) continue;
      const contentType = imgRes.headers.get("content-type") || info.mime;
      if (!contentType.startsWith("image/")) continue;
      const arrayBuf = await imgRes.arrayBuffer();
      if (arrayBuf.byteLength < 10_000) continue;
      return {
        buffer: Buffer.from(arrayBuf),
        mime: contentType.split(";")[0].trim(),
      };
    } catch {
      // Try next candidate
    }
  }

  return null;
}

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function seed() {
  console.log("Checking existing listings...");
  const { data: existing, error: existingErr } = await supabase
    .from("listings")
    .select("id, title, image_url");

  if (existingErr) {
    throw new Error(`Failed to query listings: ${existingErr.message}`);
  }

  const existingByTitle = new Map(
    (existing ?? []).map((row) => [row.title.trim().toLowerCase(), row])
  );

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const item of SEED_LISTINGS) {
    const existingRow = existingByTitle.get(item.title.trim().toLowerCase());
    if (existingRow && existingRow.image_url) {
      console.log(`- Skip (already exists with image): ${item.title}`);
      skippedCount += 1;
      continue;
    }

    let publicImageUrl = null;
    console.log(`- Fetching image for "${item.title}" (${item.imageQuery})...`);
    const img = await findWikimediaImage(item.imageQuery);

    if (img) {
      const ext = extFromMime(img.mime);
      const storagePath = `seed/${item.slug}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("listing-images")
        .upload(storagePath, img.buffer, {
          contentType: img.mime,
          upsert: true,
        });

      if (uploadErr) {
        console.warn(`  ! Storage upload failed for ${item.slug}: ${uploadErr.message}`);
      } else {
        const { data: urlData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(storagePath);
        publicImageUrl = urlData.publicUrl;
      }
    } else {
      console.warn(`  ! No suitable image found for "${item.imageQuery}"`);
    }

    if (existingRow) {
      if (publicImageUrl) {
        const { error: updateErr } = await supabase
          .from("listings")
          .update({ image_url: publicImageUrl })
          .eq("id", existingRow.id);
        if (updateErr) {
          console.error(`  ! Update failed for "${item.title}": ${updateErr.message}`);
        } else {
          updatedCount += 1;
          console.log(`  ✓ Backfilled image for [${item.category}] ${item.title}`);
        }
      } else {
        skippedCount += 1;
      }
      continue;
    }

    const createdAt = new Date(
      Date.now() - item.hoursAgo * 60 * 60 * 1000
    ).toISOString();

    const { error: insertErr } = await supabase.from("listings").insert({
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      seller_email: item.seller_email,
      image_url: publicImageUrl,
      location: item.location,
      created_at: createdAt,
      updated_at: createdAt,
    });

    if (insertErr) {
      console.error(`  ! Insert failed for "${item.title}": ${insertErr.message}`);
    } else {
      insertedCount += 1;
      console.log(
        `  ✓ Inserted [${item.category}] $${item.price} — ${publicImageUrl ? "with Supabase image" : "no image"}`
      );
    }
  }

  console.log(
    `\nSeeding complete: ${insertedCount} inserted, ${updatedCount} backfilled, ${skippedCount} skipped.`
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
