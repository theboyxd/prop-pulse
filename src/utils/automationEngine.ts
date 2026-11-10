export interface BentoCardItem {
  id: string;
  label: string;
  last4: string;
  holder?: string;
  expiry?: string;
  balance?: string;
  color: string;
  color2: string;
  ink: string;
}

export interface BentoActivityItem {
  id: string;
  kind: "swap" | "bridge" | "stake" | "mint" | "receive";
  title: string;
  detail: string;
  amount: string;
  status: "pending" | "confirmed" | "failed";
  time: string;
}

export interface BentoDataset {
  id: string;
  roleLabel: string;
  account: string;
  network: string;
  greetingSubtitle: string;
  heroMetricLabel: string;
  chartTitle: string;
  chartPrimaryLabel: string;
  chartSecondaryLabel: string;
  chartBadgeSuffix: string;
  cardsTitle: string;
  gasTitle: string;
  gasUnit: string;
  gasSubtextPrefix: string;
  allocationTitle: string;
  stakingTitle: string;
  stakingStatus: string;
  stakingMetricSuffix: string;
  stakingSubtext: string;
  stakingPayoutLabel: string;
  stakingMeta: [string, string][];
  stakingRewardsLabel: string;
  stakingButtonText: string;
  stakingButtonDoneText: string;
  liquidityPair: string;
  liquidityFee: string;
  liquiditySubtext: string;
  liquidityFooterPrefix: string;
  blocksTitle: string;
  blocksTargetText: string;
  blocksFooterLabels: [string, string, string];
  activityTitle: string;
  history: number[];
  benchmark: number[];
  allocation: { symbol: string; value: number }[];
  staking: {
    asset: string;
    staked: number;
    apy: number;
    rewards: number;
    usdPrice: number;
  };
  liquidity: {
    pair: string;
    fee: string;
    min: number;
    max: number;
    price: number;
    fees: number;
  };
  activity: BentoActivityItem[];
  cards: BentoCardItem[];
}

export interface PropertyLead {
  id: string;
  title: string;
  address: string;
  cityId: string;
  cityName: string;
  coordinates: string;
  distanceKm: number;
  mapX?: number; // 0-100 % on custom territory map
  mapY?: number; // 0-100 % on custom territory map
  keywords?: string[];
  price: number;
  suggestedPrice: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  imageUrl: string;
  ownerName: string;
  ownerPhone: string;
  daysOnMarket: number;
  qualificationStatus: "extracted" | "qualifying" | "nurtured" | "price_drop_agreed";
  priceChangeStatus: "idle" | "sent" | "negotiating" | "accepted";
  assignedAgent: string;
  aiVideoReady: boolean;
  lastWhatsAppReply?: string;
  propertyStatusNote?: string;
  lastCrmSync?: string;
}

export interface PriceChangeConfig {
  enabled: boolean;
  minDaysOnMarket: number;
  targetReductionPercent: number;
  followUpHours: number;
  autoUpdatePortalPrice: boolean;
  includeBuyerDemandProof: boolean;
  messageTemplate: string;
  crmSystemName?: string;
  checkInFrequency?: string;
  checkAvailability?: boolean;
  checkPropertyChanges?: boolean;
}

export interface WhatsAppAIConfig {
  enabled247: boolean;
  responseLatencySec: number;
  aiPersonaName: string;
  qualifyBudget: boolean;
  qualifyTimeline: boolean;
  autoSendSellingVideo: boolean;
  instantAgentHandoffScore: number;
}

export function deterministicWalk(
  seed: number,
  length: number,
  start: number,
  drift: number,
  volatility: number
): number[] {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const raw: number[] = [];
  let val = start;
  for (let i = 0; i < length; i++) {
    val *= 1 + drift + (rnd() - 0.5) * volatility;
    raw.push(val);
  }
  return raw.map((_, idx) => {
    const windowSlice = raw.slice(Math.max(0, idx - 3), idx + 1);
    return windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
  });
}

export function calculatePriceReductionOffer(
  currentPrice: number,
  reductionPercent: number
): {
  currentPrice: number;
  suggestedPrice: number;
  savingsAmount: number;
  reductionPercent: number;
} {
  const clampedPercent = Math.max(1, Math.min(35, reductionPercent));
  const rawSuggested = currentPrice * (1 - clampedPercent / 100);
  const suggestedPrice = Math.round(rawSuggested / 1000) * 1000;
  const savingsAmount = Math.max(0, currentPrice - suggestedPrice);
  return {
    currentPrice,
    suggestedPrice,
    savingsAmount,
    reductionPercent: clampedPercent,
  };
}

export function renderPriceChangeMessage(
  template: string,
  lead: Pick<PropertyLead, "ownerName" | "title" | "price" | "daysOnMarket">,
  reductionPercent: number,
  matchedBuyersCount = 6
): string {
  const offer = calculatePriceReductionOffer(lead.price, reductionPercent);
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return template
    .replace(/\{\{ownerName\}\}/g, lead.ownerName)
    .replace(/\{\{propertyTitle\}\}/g, lead.title)
    .replace(/\{\{currentPrice\}\}/g, fmt.format(offer.currentPrice))
    .replace(/\{\{suggestedPrice\}\}/g, fmt.format(offer.suggestedPrice))
    .replace(/\{\{reductionPercent\}\}/g, `${offer.reductionPercent}%`)
    .replace(/\{\{daysOnMarket\}\}/g, `${lead.daysOnMarket}`)
    .replace(/\{\{buyerMatches\}\}/g, `${matchedBuyersCount}`);
}

export function filterPropertiesByTerritory(
  properties: PropertyLead[],
  cityId: string,
  maxRadiusKm: number,
  searchQuery = ""
): PropertyLead[] {
  const q = searchQuery.trim().toLowerCase();
  return properties.filter((p) => {
    const matchesCity = cityId === "all" || p.cityId === cityId;
    const withinRadius = p.distanceKm <= maxRadiusKm;
    if (!matchesCity || !withinRadius) return false;
    if (!q) return true;

    const searchableText = [
      p.title,
      p.address,
      p.cityName,
      p.ownerName,
      p.assignedAgent,
      `${p.bedrooms} bed`,
      `${p.bedrooms} bedrooms`,
      `${p.bathrooms} bath`,
      ...(p.keywords ?? []),
      p.propertyStatusNote ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return q.split(/\s+/).every((word) => searchableText.includes(word));
  });
}

export function parseOwnerMonthlyReplyForCRM(
  incomingText: string,
  currentPrice: number
): {
  updatedPrice: number;
  priceChanged: boolean;
  statusNote: string;
  crmSummary: string;
} {
  const normalized = incomingText.toLowerCase();

  // Check if owner mentioned a new price like "$550,000" or "550k" or "550000"
  const kMatch = incomingText.match(/\$?\s*(\d{2,4})\s*k\b/i);
  const fullNumberMatch = incomingText.match(/\$?\s*(\d{3}[,.]?\d{3})/);

  let updatedPrice = currentPrice;
  let priceChanged = false;

  if (kMatch) {
    updatedPrice = Number(kMatch[1]) * 1000;
    priceChanged = updatedPrice !== currentPrice;
  } else if (fullNumberMatch) {
    const cleaned = Number(fullNumberMatch[1].replace(/[,.]/g, ""));
    if (cleaned >= 50000) {
      updatedPrice = cleaned;
      priceChanged = updatedPrice !== currentPrice;
    }
  }

  if (normalized.includes("sold") || normalized.includes("rented")) {
    return {
      updatedPrice,
      priceChanged,
      statusNote: normalized.includes("sold")
        ? "Marked as Sold by Owner"
        : "Marked as Rented by Owner",
      crmSummary: normalized.includes("sold")
        ? "CRM Status changed to SOLD · Listing archived automatically"
        : "CRM Status changed to RENTED · Listing paused automatically",
    };
  }

  if (priceChanged) {
    const fmtNew = `$${updatedPrice.toLocaleString("en-US")}`;
    const fmtOld = `$${currentPrice.toLocaleString("en-US")}`;
    return {
      updatedPrice,
      priceChanged: true,
      statusNote: `Price updated to ${fmtNew} via Monthly WhatsApp Check-In`,
      crmSummary: `CRM Price automatically updated from ${fmtOld} → ${fmtNew}`,
    };
  }

  if (
    normalized.includes("renovated") ||
    normalized.includes("painted") ||
    normalized.includes("pool") ||
    normalized.includes("kitchen") ||
    normalized.includes("roof") ||
    normalized.includes("new")
  ) {
    return {
      updatedPrice,
      priceChanged: false,
      statusNote: `Property update noted: "${incomingText.trim()}"`,
      crmSummary: "CRM Property Description & Agent Notes updated automatically",
    };
  }

  return {
    updatedPrice,
    priceChanged: false,
    statusNote: "Verified active · No price change this month",
    crmSummary: "CRM Listing verified active & up-to-date for another 30 days",
  };
}

export function generateWhatsAppAIReply(
  incomingText: string,
  config: WhatsAppAIConfig,
  activeProperty?: PropertyLead
): {
  replyText: string;
  detectedIntent:
    | "price_negotiation"
    | "video_request"
    | "schedule_visit"
    | "lead_qualification";
  leadScoreDelta: number;
} {
  const normalized = incomingText.toLowerCase();
  const propName = activeProperty?.title ?? "Serenity Residential Home";
  const currentPriceStr = activeProperty
    ? `$${activeProperty.price.toLocaleString("en-US")}`
    : "$570,000";

  const parsed = parseOwnerMonthlyReplyForCRM(
    incomingText,
    activeProperty?.price ?? 570000
  );

  if (
    parsed.priceChanged ||
    normalized.includes("price") ||
    normalized.includes("change") ||
    normalized.includes("lower") ||
    normalized.includes("update") ||
    normalized.includes("valor") ||
    normalized.includes("owner")
  ) {
    const newPriceFormatted = `$${parsed.updatedPrice.toLocaleString("en-US")}`;
    return {
      replyText: parsed.priceChanged
        ? `Thank you! I have automatically updated ${propName} to ${newPriceFormatted} in our company CRM and notified our agents so they can share the new price with interested buyers right away.`
        : `Got it! I’ve logged your update for ${propName} (${currentPriceStr}) in our agency CRM and shared the new property details with your assigned agent (${activeProperty?.assignedAgent ?? "Lucas Mendes"}).`,
      detectedIntent: "price_negotiation",
      leadScoreDelta: 18,
    };
  }

  if (
    normalized.includes("video") ||
    normalized.includes("tour") ||
    normalized.includes("photo") ||
    normalized.includes("see") ||
    normalized.includes("footage")
  ) {
    return {
      replyText: `I just generated the HD Selling Video tour for ${propName} (${currentPriceStr})! Sending the walkthrough video right now and attaching it to the property record in our CRM.`,
      detectedIntent: "video_request",
      leadScoreDelta: 24,
    };
  }

  if (
    normalized.includes("visit") ||
    normalized.includes("schedule") ||
    normalized.includes("tomorrow") ||
    normalized.includes("book") ||
    normalized.includes("available")
  ) {
    return {
      replyText: `Perfect! I’ve marked ${propName} as confirmed available in our system and scheduled the showing on ${activeProperty?.assignedAgent ?? "Lucas Mendes"}’s calendar.`,
      detectedIntent: "schedule_visit",
      leadScoreDelta: 30,
    };
  }

  return {
    replyText: `Thanks for the update on ${propName}! I have saved your message directly into our real estate system so all agents have the latest information.`,
    detectedIntent: "lead_qualification",
    leadScoreDelta: 12,
  };
}

export const INITIAL_CITY_TERRITORIES = [
  {
    id: "miami",
    location: "Miami, FL",
    coordinates: "25.7617° N, 80.1918° W",
    defaultRadiusKm: 12,
    totalScannedParcels: 1420,
    neighborhoods: ["Brickell", "Coral Gables", "Coconut Grove", "Wynwood", "Edgewater"],
  },
  {
    id: "saopaulo",
    location: "São Paulo, SP",
    coordinates: "23.5505° S, 46.6333° W",
    defaultRadiusKm: 10,
    totalScannedParcels: 2180,
    neighborhoods: ["Jardins", "Itaim Bibi", "Vila Nova", "Pinheiros", "Moema"],
  },
  {
    id: "austin",
    location: "Austin, TX",
    coordinates: "30.2672° N, 97.7431° W",
    defaultRadiusKm: 15,
    totalScannedParcels: 980,
    neighborhoods: ["Barton Creek", "Westlake", "Zilker", "Tarrytown", "Downtown"],
  },
  {
    id: "lisbon",
    location: "Cascais · Lisbon",
    coordinates: "38.6979° N, 9.4215° W",
    defaultRadiusKm: 8,
    totalScannedParcels: 740,
    neighborhoods: ["Monte Estoril", "Quinta da Marinha", "Centro", "Carcavelos", "Oeiras"],
  },
  {
    id: "sf",
    location: "San Francisco, CA",
    coordinates: "37.7749° N, 122.4194° W",
    defaultRadiusKm: 9,
    totalScannedParcels: 1150,
    neighborhoods: ["Pacific Heights", "Marina", "Noe Valley", "SoMa", "Russian Hill"],
  },
];

export const BENTO_PROFILES: Record<string, BentoDataset> = {
  owner_all: {
    id: "owner_all",
    roleLabel: "Company Owner · All 14 Agents",
    account: "agency.owner",
    network: "CRM Connected · Live",
    greetingSubtitle:
      "Track your team's sales, monthly owner WhatsApp check-ins, and automatic CRM updates.",
    heroMetricLabel: "Total Agency Sales Volume",
    chartTitle: "Agency Sales with Automated CRM Updates",
    chartPrimaryLabel: "This Year",
    chartSecondaryLabel: "Last Year",
    chartBadgeSuffix: "% Growth",
    cardsTitle: "Your Team",
    gasTitle: "WhatsApp Reply Time",
    gasUnit: "sec",
    gasSubtextPrefix: "24/7 AI Assistant · ",
    allocationTitle: "Where Leads Come From",
    stakingTitle: "Monthly Owner Check-In",
    stakingStatus: "Auto-Sync On",
    stakingMetricSuffix: "%",
    stakingSubtext: "48 property owners checked automatically every month",
    stakingPayoutLabel: "Next monthly check-in",
    stakingMeta: [
      ["Owners Checked", "1,284"],
      ["Owners Replied", "892"],
      ["CRM System", "Auto-Synced"],
    ],
    stakingRewardsLabel: "Listings automatically updated in CRM this month",
    stakingButtonText: "Send monthly owner check-in now",
    stakingButtonDoneText: "Monthly check-in sent to all owners",
    liquidityPair: "Portfolio Price Updates · This Month",
    liquidityFee: "CRM Synced",
    liquiditySubtext: "avg listing price ($k)",
    liquidityFooterPrefix: "Active buyers matched ",
    blocksTitle: "Map Leads Found",
    blocksTargetText: "Auto-saved to CRM",
    blocksFooterLabels: ["Reply speed", "Owners found", "CRM updates"],
    activityTitle: "Recent Owner Replies & CRM Updates",
    history: deterministicWalk(7, 365, 240000, 0.0014, 0.042),
    benchmark: deterministicWalk(11, 365, 240000, 0.0005, 0.048),
    allocation: [
      { symbol: "Map Search", value: 58200 },
      { symbol: "WhatsApp 24/7", value: 28400 },
      { symbol: "Monthly Check-In", value: 14800 },
      { symbol: "Property Videos", value: 9600 },
      { symbol: "Referrals", value: 4300 },
    ],
    staking: {
      asset: "Listings",
      staked: 48,
      apy: 94.2,
      rewards: 18,
      usdPrice: 1000,
    },
    liquidity: {
      pair: "Average Listing Price Band",
      fee: "Auto-Updated",
      min: 495,
      max: 585,
      price: 542.5,
      fees: 48200,
    },
    activity: [
      {
        id: "a1",
        kind: "bridge",
        title: "CRM Price Updated · 15 S Aurora Ave",
        detail: "Owner Carlos replied on WhatsApp: new price $536,000",
        amount: "$536,000",
        status: "confirmed",
        time: "now",
      },
      {
        id: "a2",
        kind: "swap",
        title: "Map Leads Saved · Miami Zone",
        detail: "38 property owner phone numbers added to CRM",
        amount: "+38 Leads",
        status: "confirmed",
        time: "9m",
      },
      {
        id: "a3",
        kind: "stake",
        title: "Photos Turned into Selling Video",
        detail: "Serenity Home · Ready to send on WhatsApp",
        amount: "HD Video",
        status: "confirmed",
        time: "28m",
      },
      {
        id: "a4",
        kind: "mint",
        title: "Monthly Check-In · Jardins Penthouse",
        detail: "Owner confirmed kitchen remodel · CRM notes updated",
        amount: "Synced",
        status: "confirmed",
        time: "1h",
      },
    ],
    cards: [
      {
        id: "ag3",
        label: "Rafael Silva · Austin",
        last4: "19 Sales",
        holder: "42 Listings Checked Monthly · CRM Synced",
        expiry: "Senior Agent",
        balance: "$82,400",
        color: "oklch(0.82 0.11 55)",
        color2: "oklch(0.7 0.15 30)",
        ink: "oklch(0.25 0.05 40)",
      },
      {
        id: "ag2",
        label: "Sofia Costa · São Paulo",
        last4: "24 Sales",
        holder: "14 Selling Videos Created · CRM Synced",
        expiry: "Top Producer",
        balance: "$114,900",
        color: "oklch(0.8 0.1 300)",
        color2: "oklch(0.64 0.15 285)",
        ink: "oklch(0.2 0.06 290)",
      },
      {
        id: "ag1",
        label: "Lucas Mendes · Miami",
        last4: "31 Sales",
        holder: "64 Listings Auto-Updated via WhatsApp",
        expiry: "#1 Agent",
        balance: "$164,316",
        color: "oklch(0.89 0.2 128)",
        color2: "oklch(0.74 0.17 165)",
        ink: "oklch(0.22 0.06 140)",
      },
    ],
  },
  agent_lucas: {
    id: "agent_lucas",
    roleLabel: "Agent View · Lucas Mendes (Miami)",
    account: "lucas.mendes",
    network: "Miami CRM · Synced",
    greetingSubtitle:
      "Your personal listings, monthly owner WhatsApp updates, and commission progress.",
    heroMetricLabel: "My Sales Commission",
    chartTitle: "Lucas Commission vs Team Average",
    chartPrimaryLabel: "Lucas Mendes",
    chartSecondaryLabel: "Team Average",
    chartBadgeSuffix: "% Above Avg",
    cardsTitle: "My Listings",
    gasTitle: "WhatsApp Reply Time",
    gasUnit: "sec",
    gasSubtextPrefix: "24/7 AI Assistant · ",
    allocationTitle: "My Lead Sources",
    stakingTitle: "My Owner Check-Ins",
    stakingStatus: "Monthly Auto",
    stakingMetricSuffix: "%",
    stakingSubtext: "19 Miami owners checked automatically every 30 days",
    stakingPayoutLabel: "Next check-in",
    stakingMeta: [
      ["My Listings", "19"],
      ["Updated Today", "6 listings"],
      ["Selling Videos", "19 videos"],
    ],
    stakingRewardsLabel: "Price & status updates saved to CRM",
    stakingButtonText: "Check in with my owners now",
    stakingButtonDoneText: "Miami owners messaged on WhatsApp",
    liquidityPair: "My Miami Listings · Price Range",
    liquidityFee: "CRM Synced",
    liquiditySubtext: "average listing ($k)",
    liquidityFooterPrefix: "Active buyers matched ",
    blocksTitle: "Miami Map Search",
    blocksTargetText: "12km range",
    blocksFooterLabels: ["AI reply", "Owners found", "CRM synced"],
    activityTitle: "My Recent CRM & WhatsApp Updates",
    history: deterministicWalk(19, 365, 84000, 0.0016, 0.04),
    benchmark: deterministicWalk(11, 365, 84000, 0.0007, 0.045),
    allocation: [
      { symbol: "Miami Map Search", value: 64000 },
      { symbol: "WhatsApp 24/7", value: 39000 },
      { symbol: "Monthly Check-In", value: 28000 },
      { symbol: "Selling Videos", value: 18500 },
      { symbol: "Referrals", value: 14816 },
    ],
    staking: {
      asset: "Listings",
      staked: 19,
      apy: 96.4,
      rewards: 9,
      usdPrice: 1000,
    },
    liquidity: {
      pair: "Miami Homes · Price Band",
      fee: "Auto-Synced",
      min: 520,
      max: 610,
      price: 570.0,
      fees: 24600,
    },
    activity: [
      {
        id: "l1",
        kind: "bridge",
        title: "Carlos M. updated price on WhatsApp",
        detail: "Serenity Residential Home · Synced to CRM automatically",
        amount: "$536,000",
        status: "confirmed",
        time: "now",
      },
      {
        id: "l2",
        kind: "swap",
        title: "Selling Video Sent to 14 Buyers",
        detail: "15 S Aurora Ave · Created from property photos",
        amount: "14 Views",
        status: "confirmed",
        time: "14m",
      },
      {
        id: "l3",
        kind: "stake",
        title: "Coral Gables Map Range Extracted",
        detail: "18 owner phone numbers added to your CRM",
        amount: "+18 Owners",
        status: "confirmed",
        time: "1h",
      },
    ],
    cards: [
      {
        id: "lc3",
        label: "Biscayne Bay Townhome",
        last4: "Synced",
        holder: "Owner: Elena Rostova · Checked this month",
        expiry: "Miami, FL",
        balance: "$740,000",
        color: "oklch(0.82 0.11 55)",
        color2: "oklch(0.7 0.15 30)",
        ink: "oklch(0.25 0.05 40)",
      },
      {
        id: "lc2",
        label: "Coconut Grove Villa",
        last4: "Video Ready",
        holder: "Owner: Marcus Vance · Pool & Garden",
        expiry: "Miami, FL",
        balance: "$1,180,000",
        color: "oklch(0.8 0.1 300)",
        color2: "oklch(0.64 0.15 285)",
        ink: "oklch(0.2 0.06 290)",
      },
      {
        id: "lc1",
        label: "Serenity Residential Home",
        last4: "Updated",
        holder: "Owner: Carlos Mendoza · 15 S Aurora Ave",
        expiry: "New Price",
        balance: "$536,000",
        color: "oklch(0.89 0.2 128)",
        color2: "oklch(0.74 0.17 165)",
        ink: "oklch(0.22 0.06 140)",
      },
    ],
  },
  agent_sofia: {
    id: "agent_sofia",
    roleLabel: "Agent View · Sofia Costa (São Paulo)",
    account: "sofia.costa",
    network: "São Paulo CRM · Synced",
    greetingSubtitle:
      "Tracking your São Paulo listings, monthly owner WhatsApp check-ins, and selling videos.",
    heroMetricLabel: "My Sales Commission",
    chartTitle: "Sofia Commission vs Team Average",
    chartPrimaryLabel: "Sofia Costa",
    chartSecondaryLabel: "Team Average",
    chartBadgeSuffix: "% Above Avg",
    cardsTitle: "My Listings",
    gasTitle: "WhatsApp Reply Time",
    gasUnit: "sec",
    gasSubtextPrefix: "24/7 AI Assistant · ",
    allocationTitle: "My Lead Sources",
    stakingTitle: "Monthly Owner Check-In",
    stakingStatus: "Auto-Sync On",
    stakingMetricSuffix: "%",
    stakingSubtext: "14 São Paulo owners checked automatically every month",
    stakingPayoutLabel: "Next check-in",
    stakingMeta: [
      ["My Owners", "96"],
      ["CRM Updates", "9 listings"],
      ["Videos Sent", "112 videos"],
    ],
    stakingRewardsLabel: "Listings updated automatically in CRM",
    stakingButtonText: "Check in with São Paulo owners",
    stakingButtonDoneText: "São Paulo owners messaged",
    liquidityPair: "Jardins Listings · Price Range",
    liquidityFee: "CRM Synced",
    liquiditySubtext: "average price ($k)",
    liquidityFooterPrefix: "Matched buyers ",
    blocksTitle: "São Paulo Map Search",
    blocksTargetText: "10km range",
    blocksFooterLabels: ["AI reply", "Owners found", "CRM synced"],
    activityTitle: "Sofia’s Recent CRM & WhatsApp Updates",
    history: deterministicWalk(23, 365, 68000, 0.0013, 0.039),
    benchmark: deterministicWalk(11, 365, 68000, 0.0006, 0.045),
    allocation: [
      { symbol: "Property Videos", value: 46000 },
      { symbol: "Map Search", value: 34000 },
      { symbol: "WhatsApp 24/7", value: 21000 },
      { symbol: "Monthly Check-In", value: 13900 },
    ],
    staking: {
      asset: "Videos",
      staked: 14,
      apy: 92.8,
      rewards: 9,
      usdPrice: 1000,
    },
    liquidity: {
      pair: "Jardins · Price Range",
      fee: "Auto-Synced",
      min: 780,
      max: 940,
      price: 890.0,
      fees: 19400,
    },
    activity: [
      {
        id: "s1",
        kind: "stake",
        title: "Penthouse Photos Turned into Video",
        detail: "Jardins Sky Penthouse · Sent to 9 buyers on WhatsApp",
        amount: "$890,000",
        status: "confirmed",
        time: "now",
      },
      {
        id: "s2",
        kind: "bridge",
        title: "Owner Fernanda L. updated price to $850,000",
        detail: "Replied to monthly WhatsApp check-in · Saved to CRM",
        amount: "$850,000",
        status: "confirmed",
        time: "22m",
      },
    ],
    cards: [
      {
        id: "sc2",
        label: "Vila Nova Duplex",
        last4: "Synced",
        holder: "Owner: Roberto Alves · Checked this month",
        expiry: "São Paulo",
        balance: "$690,000",
        color: "oklch(0.8 0.1 300)",
        color2: "oklch(0.64 0.15 285)",
        ink: "oklch(0.2 0.06 290)",
      },
      {
        id: "sc1",
        label: "Jardins Sky Penthouse",
        last4: "Video Active",
        holder: "Owner: Fernanda Lima · CRM Updated",
        expiry: "São Paulo",
        balance: "$890,000",
        color: "oklch(0.89 0.2 128)",
        color2: "oklch(0.74 0.17 165)",
        ink: "oklch(0.22 0.06 140)",
      },
    ],
  },
};
