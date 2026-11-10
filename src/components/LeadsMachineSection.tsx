import React, { useState } from "react";
import { PreviewCard } from "./ui/card-02";
import { Tile, Pills } from "./ui/web3-bento";
import {
  INITIAL_CITY_TERRITORIES,
  filterPropertiesByTerritory,
  type PropertyLead,
} from "../utils/automationEngine";
import {
  Search,
  MapPin,
  Video,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  X,
  PlusCircle,
} from "lucide-react";

const ACCENT_LIME = "oklch(0.89 0.2 128)";
const ACCENT_PURPLE = "oklch(0.74 0.12 300)";
const INK_DARK = "oklch(0.24 0.06 135)";

const QUICK_SEARCH_WORDS = [
  "Pool",
  "Penthouse",
  "Villa",
  "Coastal",
  "Garden",
  "5 bed",
  "Miami",
  "São Paulo",
];

interface LeadsMachineSectionProps {
  properties: PropertyLead[];
  onDispatchOwnerQualification: (id: string) => void;
  onDispatchAllInTerritory: (cityId: string, maxRadiusKm: number) => void;
  onRequestPriceDrop: (id: string) => void;
  onOpenVideoStudioForProperty: (property: PropertyLead) => void;
  onExtractMoreLeads: (cityId: string, radiusKm: number, keyword?: string) => void;
}

export function LeadsMachineSection({
  properties,
  onDispatchOwnerQualification,
  onDispatchAllInTerritory,
  onRequestPriceDrop,
  onOpenVideoStudioForProperty,
  onExtractMoreLeads,
}: LeadsMachineSectionProps) {
  const [selectedCityId, setSelectedCityId] = useState<string>("all");
  const [activeMapTerritoryId, setActiveMapTerritoryId] =
    useState<string>("miami");
  const [radiusKm, setRadiusKm] = useState<number>(12);
  const [searchWord, setSearchWord] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [selectedMapPropId, setSelectedMapPropId] = useState<string | null>(
    null
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanCountBanner, setScanCountBanner] = useState<string | null>(null);

  const activeTerritory =
    INITIAL_CITY_TERRITORIES.find((t) => t.id === activeMapTerritoryId) ??
    INITIAL_CITY_TERRITORIES[0];

  const visibleProperties = filterPropertiesByTerritory(
    properties,
    selectedCityId,
    radiusKm,
    searchWord
  );

  // Properties plotted on the interactive map (all properties so the user can visually see which ones fall inside vs outside the selected range)
  const mapPins = properties.map((p, idx) => {
    const defaultPositions = [
      { x: 44, y: 42 },
      { x: 63, y: 36 },
      { x: 31, y: 66 },
      { x: 72, y: 64 },
      { x: 54, y: 26 },
      { x: 38, y: 32 },
    ];
    const pos = defaultPositions[idx % defaultPositions.length];
    const x = p.mapX ?? pos.x;
    const y = p.mapY ?? pos.y;

    const inRange = p.distanceKm <= radiusKm;
    const matchesSearch =
      !searchWord.trim() ||
      [
        p.title,
        p.address,
        p.cityName,
        p.ownerName,
        ...(p.keywords ?? []),
        `${p.bedrooms} bed`,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchWord.trim().toLowerCase());

    return {
      ...p,
      x,
      y,
      inRange: inRange && matchesSearch,
    };
  });

  const inRangeCount = mapPins.filter((p) => p.inRange).length;
  const selectedPin =
    mapPins.find((p) => p.id === selectedMapPropId) ?? mapPins[0];

  const handleRunExtractor = () => {
    setIsScanning(true);
    setScanCountBanner(null);
    window.setTimeout(() => {
      onExtractMoreLeads(
        activeMapTerritoryId,
        radiusKm,
        searchWord.trim() || undefined
      );
      setIsScanning(false);
      setScanCountBanner(
        `Added new property lead & owner contact in ${activeTerritory.location} (within ${radiusKm} km${
          searchWord.trim() ? ` matching "${searchWord.trim()}"` : ""
        }) to your CRM!`
      );
    }, 300);
  };

  // Visual radius percentage on the map canvas (maps 2km..25km to 18%..88% diameter)
  const circleDiameterPct = Math.min(90, Math.max(20, (radiusKm / 25) * 86));

  return (
    <div className="w-full max-w-[1120px] space-y-6">
      {/* Word Search Bar & Quick Keyword Chips */}
      <Tile
        title="Find Property Leads by Word or Area"
        action={
          <span className="font-mono text-[11px] text-emerald-400">
            {visibleProperties.length} matching properties in range
          </span>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                aria-label="Search properties by word, feature, neighborhood, or owner"
                placeholder="Search any word (e.g. pool, penthouse, villa, coastal, garden, 5 bed, owner name)..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background pl-10 pr-9 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchWord && (
                <button
                  type="button"
                  aria-label="Clear search word"
                  onClick={() => setSearchWord("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunExtractor}
              disabled={isScanning}
              className="rounded-2xl py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] whitespace-nowrap shrink-0"
              style={{ background: ACCENT_LIME, color: INK_DARK }}
            >
              <PlusCircle size={15} />
              {isScanning
                ? "Finding Owner Contacts..."
                : `Extract Leads in ${radiusKm} km Range`}
            </button>
          </div>

          {/* Quick Clickable Word Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground mr-1">
              Popular words:
            </span>
            {QUICK_SEARCH_WORDS.map((word) => {
              const isActive =
                searchWord.trim().toLowerCase() === word.toLowerCase();
              return (
                <button
                  key={word}
                  type="button"
                  onClick={() => setSearchWord(isActive ? "" : word)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-foreground text-background"
                      : "border border-border bg-background/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      </Tile>

      {/* Interactive Range Extraction Map + Simple Range Controls (No Owner Nurturing Funnel) */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {/* Custom Interactive Map Where Users Visualize Extraction Range */}
        <Tile
          title="Interactive Lead Extraction Map · Click Anywhere or Drag Range Slider"
          action={
            <span className="font-mono text-[11px] text-emerald-400">
              {activeTerritory.location} · {radiusKm} km Range
            </span>
          }
          className="lg:col-span-3 flex flex-col justify-between"
        >
          {/* City Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {INITIAL_CITY_TERRITORIES.map((city) => {
                const active = city.id === activeMapTerritoryId;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      setActiveMapTerritoryId(city.id);
                      setMapCenter({ x: 50, y: 50 });
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? "bg-foreground text-background font-semibold"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {city.location}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: ACCENT_LIME }}
                />
                Inside Range ({inRangeCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-zinc-600" />
                Outside Range ({mapPins.length - inRangeCount})
              </span>
            </div>
          </div>

          {/* Custom Interactive Map Canvas */}
          <div
            role="region"
            aria-label={`Interactive lead extraction map for ${activeTerritory.location}`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = Math.round(
                ((e.clientX - rect.left) / rect.width) * 100
              );
              const clickY = Math.round(
                ((e.clientY - rect.top) / rect.height) * 100
              );
              setMapCenter({
                x: Math.max(20, Math.min(80, clickX)),
                y: Math.max(22, Math.min(78, clickY)),
              });
            }}
            className="relative h-[340px] w-full rounded-2xl border border-border bg-[#0c1015] overflow-hidden cursor-crosshair select-none"
          >
            {/* Realistic Dark City Map Vector Background: Water, Parks, Highways, Street Grid */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 800 360"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="city-blocks"
                  width="48"
                  height="48"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 48 0 L 0 0 0 48"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              {/* Base Street Grid */}
              <rect width="800" height="360" fill="url(#city-blocks)" />

              {/* Coastal Water / Bay */}
              <path
                d="M 640 0 Q 610 120 660 220 T 620 360 L 800 360 L 800 0 Z"
                fill="rgba(14, 116, 144, 0.16)"
              />
              {/* Green Parks */}
              <rect
                x="90"
                y="50"
                width="120"
                height="75"
                rx="16"
                fill="rgba(16, 185, 129, 0.08)"
              />
              <rect
                x="420"
                y="220"
                width="140"
                height="80"
                rx="18"
                fill="rgba(16, 185, 129, 0.07)"
              />

              {/* Major Arterials & Highways */}
              <path
                d="M 0 110 L 800 130"
                stroke="rgba(255,255,255,0.11)"
                strokeWidth="3"
              />
              <path
                d="M 0 245 L 800 225"
                stroke="rgba(255,255,255,0.09)"
                strokeWidth="2.5"
              />
              <path
                d="M 240 0 L 270 360"
                stroke="rgba(255,255,255,0.11)"
                strokeWidth="3"
              />
              <path
                d="M 490 0 L 460 360"
                stroke="rgba(255,255,255,0.09)"
                strokeWidth="2.5"
              />
              <path
                d="M 80 360 Q 340 180 630 0"
                stroke="rgba(251, 191, 36, 0.16)"
                strokeWidth="3.5"
                fill="none"
              />
            </svg>

            {/* Neighborhood Labels on Map */}
            {(
              activeTerritory.neighborhoods ?? [
                "Downtown",
                "Northside",
                "Waterfront",
                "Garden District",
                "West End",
              ]
            ).map((hood, idx) => {
              const hoodCoords = [
                { left: "16%", top: "22%" },
                { left: "52%", top: "18%" },
                { left: "74%", top: "48%" },
                { left: "26%", top: "76%" },
                { left: "58%", top: "78%" },
              ][idx % 5];
              return (
                <span
                  key={hood}
                  style={hoodCoords}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-wider text-white/30"
                >
                  {hood}
                </span>
              );
            })}

            {/* Visual Range Extraction Circle */}
            <div
              style={{
                left: `${mapCenter.x}%`,
                top: `${mapCenter.y}%`,
                width: `${circleDiameterPct}%`,
                height: `${circleDiameterPct * 1.45}%`,
                borderColor: ACCENT_LIME,
                background:
                  "radial-gradient(circle, rgba(184,255,60,0.16) 0%, rgba(184,255,60,0.05) 65%, transparent 100%)",
              }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed transition-all duration-200"
            >
              {/* Range Badge on Circle Rim */}
              <span
                style={{ background: ACCENT_LIME, color: INK_DARK }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold shadow whitespace-nowrap"
              >
                {radiusKm} km Extraction Range
              </span>
            </div>

            {/* Center Extraction Point Pin */}
            <div
              style={{ left: `${mapCenter.x}%`, top: `${mapCenter.y}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
            >
              <span
                className="size-3.5 rounded-full ring-4 ring-black/50"
                style={{ background: ACCENT_LIME }}
              />
            </div>

            {/* Property Pins on Map */}
            {mapPins.map((pin) => {
              const isSelected = selectedPin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMapPropId(pin.id);
                  }}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-mono font-semibold shadow-md transition-transform hover:scale-105 ${
                    pin.inRange
                      ? "ring-2 ring-black/60"
                      : "bg-zinc-900/90 text-zinc-400 border border-zinc-700 opacity-60"
                  }`}
                  title={`${pin.title} · Owner: ${pin.ownerName} (${pin.ownerPhone})`}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{
                      background: pin.inRange ? ACCENT_LIME : "#71717a",
                    }}
                  />
                  <span
                    style={{
                      color: pin.inRange ? "#ffffff" : undefined,
                    }}
                  >
                    ${Math.round(pin.price / 1000)}k
                  </span>
                  <span className="text-[9px] opacity-75">
                    ({pin.distanceKm}km)
                  </span>
                  {isSelected && (
                    <span
                      className="ml-0.5 size-1.5 rounded-full"
                      style={{ background: ACCENT_LIME }}
                    />
                  )}
                </button>
              );
            })}

            {/* Bottom Overlay Info Bar Inside Map */}
            <div className="
              absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center justify-between gap-2
              rounded-xl border border-white/10 bg-black/75 backdrop-blur-md px-3.5 py-2 text-xs
            ">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin
                  size={14}
                  style={{ color: ACCENT_LIME }}
                  className="shrink-0"
                />
                <span className="truncate font-medium text-white">
                  {selectedPin
                    ? `${selectedPin.title} · Owner: ${selectedPin.ownerName} (${selectedPin.ownerPhone})`
                    : activeTerritory.location}
                </span>
              </div>
              <span className="font-mono text-[11px] text-zinc-300">
                Click anywhere on map to move center · Drag slider to resize range
              </span>
            </div>
          </div>
        </Tile>

        {/* Simple Range & Extraction Control Panel */}
        <Tile
          title="Range & CRM Extractor"
          action={
            <span className="font-mono text-[11px] text-emerald-400">
              Ready
            </span>
          }
          className="lg:col-span-1 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="radius-slider"
                  className="text-muted-foreground font-medium"
                >
                  Extraction Range on Map
                </label>
                <span
                  className="font-mono text-sm font-semibold tabular-nums"
                  style={{ color: ACCENT_LIME }}
                >
                  {radiusKm} km
                </span>
              </div>
              <input
                id="radius-slider"
                type="range"
                min={2}
                max={25}
                step={1}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="mt-2.5 w-full accent-[#b8ff3c] cursor-pointer"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>2 km (Neighborhood)</span>
                <span>12 km (City)</span>
                <span>25 km (Metro)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected City</span>
                <span className="font-semibold">{activeTerritory.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Properties in Range
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  {inRangeCount} properties
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Owner Phone Numbers
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  Included
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company CRM Sync</span>
                <span className="font-mono font-semibold">Automatic</span>
              </div>
            </div>

            {scanCountBanner && (
              <div
                className="rounded-xl p-2.5 text-[11px] font-medium leading-snug"
                style={{
                  background:
                    "color-mix(in oklch, oklch(0.89 0.2 128) 15%, transparent)",
                  color: ACCENT_LIME,
                }}
              >
                {scanCountBanner}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={handleRunExtractor}
              disabled={isScanning}
              className="w-full rounded-2xl py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] whitespace-nowrap"
              style={{
                background: ACCENT_LIME,
                color: INK_DARK,
              }}
            >
              <PlusCircle size={15} />
              {isScanning
                ? "Extracting Contacts..."
                : `Extract Leads (${radiusKm} km)`}
            </button>

            <button
              type="button"
              onClick={() =>
                onDispatchAllInTerritory(selectedCityId, radiusKm)
              }
              className="w-full rounded-2xl py-2.5 px-4 text-xs font-medium border border-border bg-muted/50 hover:bg-muted text-foreground flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <MessageCircle size={13} />
              Send Monthly Check-In ({visibleProperties.length})
            </button>
          </div>
        </Tile>
      </div>

      {/* Filter Bar for Property Preview Cards (21st.dev/@shadcnspace/components/card-02) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Extracted Properties & Owner Contacts ({visibleProperties.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Direct owner phone numbers synced with your real estate company CRM
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Pills
            label="Filter properties by city"
            value={selectedCityId}
            options={["all", "miami", "saopaulo", "austin", "lisbon"]}
            onChange={setSelectedCityId}
          />
        </div>
      </div>

      {/* Grid of Exact 21st.dev/@shadcnspace/components/card-02 Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleProperties.map((prop) => {
          const fmtPrice = `$${prop.price.toLocaleString("en-US")}`;

          return (
            <PreviewCard
              key={prop.id}
              title={prop.title}
              address={prop.address}
              price={fmtPrice}
              bedrooms={prop.bedrooms}
              bathrooms={prop.bathrooms}
              areaSqm={prop.areaSqm}
              imageUrl={prop.imageUrl}
              onCardClick={() => onOpenVideoStudioForProperty(prop)}
              footerSlot={
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        Owner: {prop.ownerName}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {prop.ownerPhone} · {prop.distanceKm} km away
                      </p>
                    </div>
                    <span
                      className="font-mono text-[11px] font-semibold tabular-nums shrink-0"
                      style={{
                        color:
                          prop.priceChangeStatus === "accepted" ||
                          prop.priceChangeStatus === "sent"
                            ? ACCENT_LIME
                            : ACCENT_PURPLE,
                      }}
                    >
                      {prop.lastCrmSync ??
                        (prop.priceChangeStatus === "sent"
                          ? "CRM Updated"
                          : "Synced in CRM")}
                    </span>
                  </div>

                  {prop.propertyStatusNote && (
                    <p className="rounded-xl bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                      {prop.propertyStatusNote}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDispatchOwnerQualification(prop.id)}
                      className="rounded-xl py-2 px-2.5 text-[11px] font-medium border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <MessageCircle size={12} />
                      Check Owner
                    </button>

                    <button
                      type="button"
                      onClick={() => onRequestPriceDrop(prop.id)}
                      className="rounded-xl py-2 px-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      style={{
                        background:
                          prop.priceChangeStatus === "sent"
                            ? "color-mix(in oklch, oklch(0.89 0.2 128) 18%, transparent)"
                            : ACCENT_LIME,
                        color:
                          prop.priceChangeStatus === "sent"
                            ? ACCENT_LIME
                            : INK_DARK,
                      }}
                    >
                      {prop.priceChangeStatus === "sent" ? (
                        <>
                          <CheckCircle2 size={12} />
                          CRM Synced
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} />
                          Ask Update
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenVideoStudioForProperty(prop)}
                      className="rounded-xl py-2 px-2.5 text-[11px] font-medium border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Video size={12} />
                      Make Video
                    </button>
                  </div>
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
