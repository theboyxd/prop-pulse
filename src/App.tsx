import React, { useState } from "react";
import {
  LayoutDashboard,
  ChartBar,
  FolderKanban,
  Inbox,
  Video,
  Users,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Web3Bento } from "./components/ui/web3-bento";
import {
  Sidebar,
  SidebarHeader,
  SidebarToggle,
  SidebarNav,
  SidebarSection,
  SidebarItem,
  SidebarFooter,
  CountBadge,
  useSidebar,
} from "./components/ui/sidebar";
import { LeadsMachineSection } from "./components/LeadsMachineSection";
import { AutomationConfigSection } from "./components/AutomationConfigSection";
import { PhotoToVideoSection } from "./components/PhotoToVideoSection";
import {
  BENTO_PROFILES,
  calculatePriceReductionOffer,
  type PropertyLead,
  type PriceChangeConfig,
  type WhatsAppAIConfig,
} from "./utils/automationEngine";

const ACCENT_LIME = "oklch(0.89 0.2 128)";
const INK_DARK = "oklch(0.24 0.06 135)";

function WorkspaceMark() {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className="flex size-6 shrink-0 items-center justify-center rounded-[7px] text-[12px] font-bold"
        style={{ background: ACCENT_LIME, color: INK_DARK }}
      >
        P
      </div>
      {!collapsed && (
        <span className="truncate text-[13.5px] font-semibold leading-none">
          PropPulse OS
        </span>
      )}
    </div>
  );
}

function UserFooter({
  roleLabel,
  account,
}: {
  roleLabel: string;
  account: string;
}) {
  const { collapsed } = useSidebar();
  const initials = roleLabel
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <div
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background:
            "color-mix(in oklch, oklch(0.89 0.2 128) 22%, transparent)",
          color: ACCENT_LIME,
          border:
            "1px solid color-mix(in oklch, oklch(0.89 0.2 128) 45%, transparent)",
        }}
      >
        {initials}
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium leading-tight">
            {roleLabel}
          </div>
          <div className="truncate text-[11px] leading-tight text-[var(--muted-foreground)]">
            {account}@proppulse.io
          </div>
        </div>
      )}
    </>
  );
}

const INITIAL_PROPERTIES: PropertyLead[] = [
  {
    id: "prop-1",
    title: "Serenity Residential Home",
    address: "15 S Aurora Ave, Miami",
    cityId: "miami",
    cityName: "Miami, FL",
    coordinates: "25.7617° N, 80.1918° W",
    distanceKm: 4.2,
    mapX: 45,
    mapY: 42,
    keywords: ["pool", "garden", "waterfront", "modern", "miami", "5 bed"],
    price: 570000,
    suggestedPrice: 536000,
    bedrooms: 5,
    bathrooms: 3,
    areaSqm: 120,
    imageUrl: "/src/assets/images/property_serenity_miami_1794336589623.jpg",
    ownerName: "Carlos Mendoza",
    ownerPhone: "+1 (305) 555-0194",
    daysOnMarket: 38,
    qualificationStatus: "qualifying",
    priceChangeStatus: "sent",
    assignedAgent: "Lucas Mendes",
    aiVideoReady: true,
    propertyStatusNote: "Checked this month · Pool & exterior recently painted",
    lastCrmSync: "Synced in CRM",
  },
  {
    id: "prop-2",
    title: "Jardins Sky Penthouse",
    address: "Rua Oscar Freire 1420, São Paulo",
    cityId: "saopaulo",
    cityName: "São Paulo, SP",
    coordinates: "23.5505° S, 46.6333° W",
    distanceKm: 6.5,
    mapX: 62,
    mapY: 36,
    keywords: ["penthouse", "terrace", "luxury", "sao paulo", "jardins", "4 bed"],
    price: 890000,
    suggestedPrice: 837000,
    bedrooms: 4,
    bathrooms: 4,
    areaSqm: 260,
    imageUrl: "/src/assets/images/property_penthouse_sp_1794336590844.jpg",
    ownerName: "Fernanda Lima",
    ownerPhone: "+55 (11) 99412-8830",
    daysOnMarket: 45,
    qualificationStatus: "nurtured",
    priceChangeStatus: "accepted",
    assignedAgent: "Sofia Costa",
    aiVideoReady: true,
    propertyStatusNote: "Owner confirmed price & new gourmet balcony",
    lastCrmSync: "CRM Updated",
  },
  {
    id: "prop-3",
    title: "Barton Creek Modern Villa",
    address: "408 Ridgewood Rd, Austin",
    cityId: "austin",
    cityName: "Austin, TX",
    coordinates: "30.2672° N, 97.7431° W",
    distanceKm: 9.0,
    mapX: 34,
    mapY: 64,
    keywords: ["villa", "pool", "hill country", "austin", "5 bed", "garden"],
    price: 1120000,
    suggestedPrice: 1053000,
    bedrooms: 5,
    bathrooms: 4,
    areaSqm: 310,
    imageUrl: "/src/assets/images/property_villa_austin_1794336592514.jpg",
    ownerName: "Harrison Brooks",
    ownerPhone: "+1 (512) 555-0842",
    daysOnMarket: 52,
    qualificationStatus: "extracted",
    priceChangeStatus: "idle",
    assignedAgent: "Rafael Silva",
    aiVideoReady: true,
    propertyStatusNote: "Scheduled for monthly WhatsApp check-in",
    lastCrmSync: "Synced in CRM",
  },
  {
    id: "prop-4",
    title: "Cascais Coastal Residence",
    address: "Avenida Marginal 88, Cascais",
    cityId: "lisbon",
    cityName: "Cascais · Lisbon",
    coordinates: "38.6979° N, 9.4215° W",
    distanceKm: 5.5,
    mapX: 70,
    mapY: 60,
    keywords: ["coastal", "ocean", "beach", "lisbon", "cascais", "pool"],
    price: 940000,
    suggestedPrice: 884000,
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 215,
    imageUrl: "/src/assets/images/property_coastal_lisbon_1794336593971.jpg",
    ownerName: "Diogo Vasconcelos",
    ownerPhone: "+351 914 882 310",
    daysOnMarket: 33,
    qualificationStatus: "qualifying",
    priceChangeStatus: "idle",
    assignedAgent: "Sofia Costa",
    aiVideoReady: true,
    propertyStatusNote: "Verified available by owner on WhatsApp",
    lastCrmSync: "Synced in CRM",
  },
];

type ActiveSection =
  | "all"
  | "dashboard"
  | "leads"
  | "whatsapp"
  | "video";

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("all");
  const [selectedBentoRoleId, setSelectedBentoRoleId] =
    useState<string>("owner_all");
  const [properties, setProperties] =
    useState<PropertyLead[]>(INITIAL_PROPERTIES);
  const [selectedVideoProperty, setSelectedVideoProperty] =
    useState<PropertyLead>(INITIAL_PROPERTIES[0]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [priceConfig, setPriceConfig] = useState<PriceChangeConfig>({
    enabled: true,
    minDaysOnMarket: 30,
    targetReductionPercent: 5,
    followUpHours: 48,
    autoUpdatePortalPrice: true,
    includeBuyerDemandProof: true,
    crmSystemName: "Company CRM & Website",
    checkInFrequency: "Every Month (30 Days)",
    checkAvailability: true,
    checkPropertyChanges: true,
    messageTemplate:
      "Hi {{ownerName}}! Checking in from our real estate team about {{propertyTitle}}. Is it still available at {{currentPrice}}, or have you changed the price or made any updates to the property? Just reply here and I’ll update our system for the agents!",
  });

  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppAIConfig>({
    enabled247: true,
    responseLatencySec: 1.2,
    aiPersonaName: "PropPulse Assistant",
    qualifyBudget: true,
    qualifyTimeline: true,
    autoSendSellingVideo: true,
    instantAgentHandoffScore: 85,
  });

  const activeBentoDataset =
    BENTO_PROFILES[selectedBentoRoleId] ?? BENTO_PROFILES.owner_all;

  const showNotice = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleDispatchOwnerQualification = (id: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              qualificationStatus: "nurtured",
              lastCrmSync: "Checked Today",
              propertyStatusNote:
                "Monthly WhatsApp check-in sent · Owner confirmed active",
            }
          : p
      )
    );
    const target = properties.find((p) => p.id === id);
    if (target) {
      showNotice(
        `Monthly WhatsApp check-in sent to ${target.ownerName} (${target.ownerPhone}) and synced with CRM`
      );
    }
  };

  const handleDispatchAllInTerritory = (
    cityId: string,
    maxRadiusKm: number
  ) => {
    setProperties((prev) =>
      prev.map((p) => {
        const matchCity = cityId === "all" || p.cityId === cityId;
        if (matchCity && p.distanceKm <= maxRadiusKm) {
          return {
            ...p,
            qualificationStatus: "qualifying",
            lastCrmSync: "Monthly Check Sent",
          };
        }
        return p;
      })
    );
    showNotice(
      `Sent monthly WhatsApp check-in to all property owners within ${maxRadiusKm} km`
    );
  };

  const handleRequestPriceDrop = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          priceChangeStatus: "sent",
          lastCrmSync: "CRM Synced",
          propertyStatusNote:
            "Asked owner on WhatsApp for any price or property changes",
        };
      })
    );
    const target = properties.find((p) => p.id === id);
    if (target) {
      showNotice(
        `Sent WhatsApp check-in to ${target.ownerName} for ${target.title} · Any reply will auto-update the CRM`
      );
    }
  };

  const handleDispatchBulkPriceSeek = () => {
    setProperties((prev) =>
      prev.map((p) => ({
        ...p,
        priceChangeStatus: "sent",
        lastCrmSync: "CRM Auto-Synced",
        propertyStatusNote:
          "Monthly WhatsApp check-in completed · Price & details synced in CRM",
      }))
    );
    showNotice(
      `Monthly WhatsApp check-in sent to all ${properties.length} property owners · Replies automatically update your CRM!`
    );
  };

  const handleApplyOwnerCrmUpdate = (
    propertyId: string,
    newPrice: number,
    statusNote: string,
    crmSummary: string
  ) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? {
              ...p,
              price: newPrice,
              priceChangeStatus: "accepted",
              propertyStatusNote: statusNote,
              lastCrmSync: "Auto-Updated Today",
            }
          : p
      )
    );
    showNotice(crmSummary);
  };

  const handleExtractMoreLeads = (
    cityId: string,
    radiusKm: number,
    keyword?: string
  ) => {
    const newId = `prop-${Date.now()}`;
    const cityMap: Record<
      string,
      {
        name: string;
        addr: string;
        coords: string;
        img: string;
        owner: string;
        phone: string;
      }
    > = {
      miami: {
        name: "Miami, FL",
        addr: "840 Brickell Key Dr, Miami",
        coords: "25.7617° N, 80.1918° W",
        img: "/src/assets/images/property_serenity_miami_1794336589623.jpg",
        owner: "Valeria Santoro",
        phone: "+1 (305) 555-0921",
      },
      saopaulo: {
        name: "São Paulo, SP",
        addr: "Alameda Santos 2100, São Paulo",
        coords: "23.5505° S, 46.6333° W",
        img: "/src/assets/images/property_penthouse_sp_1794336590844.jpg",
        owner: "Henrique Bastos",
        phone: "+55 (11) 98821-4409",
      },
      austin: {
        name: "Austin, TX",
        addr: "912 Westlake Dr, Austin",
        coords: "30.2672° N, 97.7431° W",
        img: "/src/assets/images/property_villa_austin_1794336592514.jpg",
        owner: "Claire Montgomery",
        phone: "+1 (512) 555-0377",
      },
      lisbon: {
        name: "Cascais · Lisbon",
        addr: "Rua Direita 44, Cascais",
        coords: "38.6979° N, 9.4215° W",
        img: "/src/assets/images/property_coastal_lisbon_1794336593971.jpg",
        owner: "Mateus Tavares",
        phone: "+351 919 302 118",
      },
      sf: {
        name: "San Francisco, CA",
        addr: "2140 Pacific Ave, San Francisco",
        coords: "37.7749° N, 122.4194° W",
        img: "/src/assets/images/property_serenity_miami_1794336589623.jpg",
        owner: "Marcus Chen",
        phone: "+1 (415) 555-0618",
      },
    };

    const meta = cityMap[cityId] ?? cityMap.miami;
    const basePrice = 640000;
    const offer = calculatePriceReductionOffer(
      basePrice,
      priceConfig.targetReductionPercent
    );

    const newLead: PropertyLead = {
      id: newId,
      title: `${keyword ? `${keyword} ` : ""}Residence · ${meta.name.split(",")[0]}`,
      address: meta.addr,
      cityId: cityId === "sf" ? "miami" : cityId,
      cityName: meta.name,
      coordinates: meta.coords,
      distanceKm: Math.min(radiusKm, 5.2),
      mapX: 48 + (properties.length % 4) * 6,
      mapY: 38 + (properties.length % 3) * 8,
      keywords: ["pool", "garden", "modern", keyword?.toLowerCase() ?? "villa"],
      price: basePrice,
      suggestedPrice: offer.suggestedPrice,
      bedrooms: 4,
      bathrooms: 3,
      areaSqm: 165,
      imageUrl: meta.img,
      ownerName: meta.owner,
      ownerPhone: meta.phone,
      daysOnMarket: 41,
      qualificationStatus: "qualifying",
      priceChangeStatus: "idle",
      assignedAgent: "Lucas Mendes",
      aiVideoReady: true,
      propertyStatusNote: "Extracted from map range & added to Company CRM",
      lastCrmSync: "Added to CRM",
    };

    setProperties((prev) => [newLead, ...prev]);
  };

  const handleOpenVideoStudioForProperty = (prop: PropertyLead) => {
    setSelectedVideoProperty(prop);
    setActiveSection("video");
  };

  return (
    <div className="dark min-h-screen w-full bg-background text-foreground flex">
      {/* 21st.dev @wensity/components/sidebar Left Navigation */}
      <Sidebar
        variant="collapsible"
        width={248}
        aria-label="Main navigation"
        className="sticky top-0 h-screen"
      >
        <SidebarHeader>
          <WorkspaceMark />
          <SidebarToggle className="ml-auto" />
        </SidebarHeader>

        <SidebarNav>
          <SidebarSection label="Workspace">
            <SidebarItem
              icon={<LayoutDashboard className="size-[18px]" strokeWidth={1.75} />}
              active={activeSection === "all"}
              onClick={() => setActiveSection("all")}
            >
              Overview
            </SidebarItem>
            <SidebarItem
              icon={<ChartBar className="size-[18px]" strokeWidth={1.75} />}
              active={activeSection === "dashboard"}
              onClick={() => setActiveSection("dashboard")}
            >
              Team & Sales
            </SidebarItem>
            <SidebarItem
              icon={<FolderKanban className="size-[18px]" strokeWidth={1.75} />}
              active={activeSection === "leads"}
              badge={<CountBadge>{properties.length}</CountBadge>}
              onClick={() => setActiveSection("leads")}
            >
              Leads Machine
            </SidebarItem>
            <SidebarItem
              icon={<Inbox className="size-[18px]" strokeWidth={1.75} />}
              active={activeSection === "whatsapp"}
              badge={<CountBadge>CRM</CountBadge>}
              onClick={() => setActiveSection("whatsapp")}
            >
              WhatsApp & CRM
            </SidebarItem>
            <SidebarItem
              icon={<Video className="size-[18px]" strokeWidth={1.75} />}
              active={activeSection === "video"}
              badge={<CountBadge>HD</CountBadge>}
              onClick={() => setActiveSection("video")}
            >
              Photos to Video
            </SidebarItem>
          </SidebarSection>

          <SidebarSection label="Team View">
            <SidebarItem
              icon={<Users className="size-[18px]" strokeWidth={1.75} />}
              active={selectedBentoRoleId === "owner_all"}
              badge={<CountBadge>14</CountBadge>}
              onClick={() => setSelectedBentoRoleId("owner_all")}
            >
              Company Owner
            </SidebarItem>
            <SidebarItem
              icon={<UserCheck className="size-[18px]" strokeWidth={1.75} />}
              active={selectedBentoRoleId === "agent_lucas"}
              onClick={() => setSelectedBentoRoleId("agent_lucas")}
            >
              Lucas Mendes · Miami
            </SidebarItem>
            <SidebarItem
              icon={<UserCheck className="size-[18px]" strokeWidth={1.75} />}
              active={selectedBentoRoleId === "agent_sofia"}
              onClick={() => setSelectedBentoRoleId("agent_sofia")}
            >
              Sofia Costa · SP
            </SidebarItem>
            <SidebarItem
              icon={<Sparkles className="size-[18px]" strokeWidth={1.75} />}
              onClick={handleDispatchBulkPriceSeek}
            >
              Monthly Owner Check-In
            </SidebarItem>
          </SidebarSection>
        </SidebarNav>

        <SidebarFooter>
          <UserFooter
            roleLabel={activeBentoDataset.roleLabel}
            account={activeBentoDataset.account}
          />
        </SidebarFooter>
      </Sidebar>

      {/* Main Workspace Container */}
      <div className="min-w-0 flex-1 flex flex-col items-center">
        <main className="w-full max-w-[1160px] px-4 sm:px-6 py-6 space-y-10">
          {statusBanner && (
            <div
              role="status"
              className="w-full max-w-[1120px] mx-auto rounded-2xl px-4 py-3 text-xs font-medium flex items-center justify-between"
              style={{
                background:
                  "color-mix(in oklch, oklch(0.89 0.2 128) 16%, transparent)",
                color: ACCENT_LIME,
                border:
                  "1px solid color-mix(in oklch, oklch(0.89 0.2 128) 40%, transparent)",
              }}
            >
              <span>{statusBanner}</span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="font-mono text-[11px] underline ml-4 whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* SECTION 1: Web3Bento Dashboard (Company Owner All Employees vs Individual Real Estate Agent Progress) */}
          {(activeSection === "all" || activeSection === "dashboard") && (
            <section
              aria-label="Owner and Agent Progress Bento Dashboard"
              className="flex flex-col items-center"
            >
              {/* Exact Web3Bento Header Bar with Owner / Individual Agent Switcher */}
              <div className="w-full max-w-[1120px] mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.values(BENTO_PROFILES).map((prof) => {
                    const isSelected = prof.id === selectedBentoRoleId;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => setSelectedBentoRoleId(prof.id)}
                        className={`rounded-full px-3 py-1.5 font-mono text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                          isSelected
                            ? "bg-foreground text-background font-semibold"
                            : "border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {prof.roleLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium whitespace-nowrap">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: ACCENT_LIME }}
                      aria-hidden="true"
                    />
                    {activeBentoDataset.network}
                  </span>
                  <span className="rounded-full bg-foreground px-3 py-1.5 font-mono text-[12px] font-semibold text-background whitespace-nowrap">
                    {activeBentoDataset.account}
                  </span>
                </div>
              </div>

              <Web3Bento
                dataset={activeBentoDataset}
                onTriggerBatch={handleDispatchBulkPriceSeek}
              />
            </section>
          )}

          {/* SECTION 2: Leads Machine (Word Search + Interactive Range Map + 21st.dev Card-02 Property Preview Cards) */}
          {(activeSection === "all" || activeSection === "leads") && (
            <section
              aria-label="Leads Machine and Territory Map Extractor"
              className="flex flex-col items-center"
            >
              <LeadsMachineSection
                properties={properties}
                onDispatchOwnerQualification={handleDispatchOwnerQualification}
                onDispatchAllInTerritory={handleDispatchAllInTerritory}
                onRequestPriceDrop={handleRequestPriceDrop}
                onOpenVideoStudioForProperty={handleOpenVideoStudioForProperty}
                onExtractMoreLeads={handleExtractMoreLeads}
              />
            </section>
          )}

          {/* SECTION 3: Monthly Owner Check-In & Automatic Real Estate CRM Sync */}
          {(activeSection === "all" || activeSection === "whatsapp") && (
            <section
              aria-label="Monthly Owner Check-In and WhatsApp CRM Sync"
              className="flex flex-col items-center"
            >
              <AutomationConfigSection
                priceConfig={priceConfig}
                onUpdatePriceConfig={setPriceConfig}
                whatsAppConfig={whatsAppConfig}
                onUpdateWhatsAppConfig={setWhatsAppConfig}
                properties={properties}
                onDispatchBulkPriceSeek={handleDispatchBulkPriceSeek}
                onApplyOwnerCrmUpdate={handleApplyOwnerCrmUpdate}
              />
            </section>
          )}

          {/* SECTION 4: Photos of the Place that Turn into Selling Videos */}
          {(activeSection === "all" || activeSection === "video") && (
            <section
              aria-label="Photos to Selling Video Studio"
              className="flex flex-col items-center"
            >
              <PhotoToVideoSection
                properties={properties}
                selectedProperty={selectedVideoProperty}
                onSelectProperty={setSelectedVideoProperty}
                onMarkVideoDispatched={(propId) => {
                  const target = properties.find((p) => p.id === propId);
                  showNotice(
                    `Selling Video for ${target?.title ?? "Property"} saved to CRM & sent via WhatsApp`
                  );
                }}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
