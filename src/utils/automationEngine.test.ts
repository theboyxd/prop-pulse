import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePriceReductionOffer,
  renderPriceChangeMessage,
  filterPropertiesByTerritory,
  parseOwnerMonthlyReplyForCRM,
  generateWhatsAppAIReply,
  BENTO_PROFILES,
  type PropertyLead,
  type WhatsAppAIConfig,
} from "./automationEngine";

const mockLead: PropertyLead = {
  id: "prop-1",
  title: "Serenity Residential Home",
  address: "15 S Aurora Ave, Miami",
  cityId: "miami",
  cityName: "Miami, FL",
  coordinates: "25.7617° N, 80.1918° W",
  distanceKm: 4.2,
  keywords: ["pool", "waterfront", "garden"],
  price: 570000,
  suggestedPrice: 536000,
  bedrooms: 5,
  bathrooms: 3,
  areaSqm: 120,
  imageUrl: "/test.jpg",
  ownerName: "Carlos Mendoza",
  ownerPhone: "+1 (305) 555-0194",
  daysOnMarket: 38,
  qualificationStatus: "qualifying",
  priceChangeStatus: "sent",
  assignedAgent: "Lucas Mendes",
  aiVideoReady: true,
};

test("calculatePriceReductionOffer computes rounded suggested price and savings", () => {
  const res = calculatePriceReductionOffer(570000, 6);
  assert.equal(res.currentPrice, 570000);
  assert.equal(res.suggestedPrice, 536000);
  assert.equal(res.savingsAmount, 34000);
  assert.equal(res.reductionPercent, 6);
});

test("renderPriceChangeMessage interpolates owner, property, and suggested price placeholders", () => {
  const template =
    "Hello {{ownerName}}, {{propertyTitle}} has been listed for {{daysOnMarket}} days at {{currentPrice}}. Adjusting to {{suggestedPrice}} ({{reductionPercent}}) unlocks {{buyerMatches}} buyers.";
  const msg = renderPriceChangeMessage(template, mockLead, 6, 8);
  assert.equal(
    msg,
    "Hello Carlos Mendoza, Serenity Residential Home has been listed for 38 days at $570,000. Adjusting to $536,000 (6%) unlocks 8 buyers."
  );
});

test("filterPropertiesByTerritory filters by cityId, maxRadiusKm, and keyword search", () => {
  const leads: PropertyLead[] = [
    mockLead,
    {
      ...mockLead,
      id: "prop-2",
      title: "Jardins Penthouse",
      cityId: "miami",
      distanceKm: 8,
      keywords: ["rooftop", "penthouse"],
    },
    { ...mockLead, id: "prop-3", cityId: "austin", distanceKm: 3 },
  ];
  const miamiNear = filterPropertiesByTerritory(leads, "miami", 10);
  assert.equal(miamiNear.length, 2);

  const keywordPool = filterPropertiesByTerritory(leads, "all", 20, "penthouse");
  assert.equal(keywordPool.length, 1);
  assert.equal(keywordPool[0].id, "prop-2");
});

test("parseOwnerMonthlyReplyForCRM extracts new price or property changes from WhatsApp reply", () => {
  const priceChange = parseOwnerMonthlyReplyForCRM(
    "Hi! Yes we changed the asking price to $545,000 this week",
    570000
  );
  assert.equal(priceChange.priceChanged, true);
  assert.equal(priceChange.updatedPrice, 545000);

  const soldReply = parseOwnerMonthlyReplyForCRM(
    "The house was sold yesterday",
    570000
  );
  assert.ok(soldReply.crmSummary.includes("SOLD"));
});

test("generateWhatsAppAIReply detects price updates and video requests", () => {
  const cfg: WhatsAppAIConfig = {
    enabled247: true,
    responseLatencySec: 1.2,
    aiPersonaName: "Aria AI",
    qualifyBudget: true,
    qualifyTimeline: true,
    autoSendSellingVideo: true,
    instantAgentHandoffScore: 80,
  };

  const priceReply = generateWhatsAppAIReply(
    "We updated the price to $540,000",
    cfg,
    mockLead
  );
  assert.equal(priceReply.detectedIntent, "price_negotiation");
  assert.ok(priceReply.replyText.includes("$540,000"));

  const videoReply = generateWhatsAppAIReply(
    "Can I see a video tour of the house?",
    cfg,
    mockLead
  );
  assert.equal(videoReply.detectedIntent, "video_request");
  assert.ok(videoReply.leadScoreDelta >= 20);
});

test("BENTO_PROFILES includes both owner_all and individual agent profiles", () => {
  assert.ok(BENTO_PROFILES.owner_all);
  assert.ok(BENTO_PROFILES.agent_lucas);
  assert.ok(BENTO_PROFILES.agent_sofia);
  assert.equal(BENTO_PROFILES.owner_all.history.length, 365);
});
