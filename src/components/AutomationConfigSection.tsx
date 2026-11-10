import React, { useState, useRef, useEffect } from "react";
import { Tile, Pills } from "./ui/web3-bento";
import {
  renderPriceChangeMessage,
  generateWhatsAppAIReply,
  parseOwnerMonthlyReplyForCRM,
  type PriceChangeConfig,
  type WhatsAppAIConfig,
  type PropertyLead,
} from "../utils/automationEngine";
import {
  Send,
  CheckCircle2,
  Bot,
  RefreshCw,
  Database,
  Calendar,
} from "lucide-react";

const ACCENT_LIME = "oklch(0.89 0.2 128)";
const INK_DARK = "oklch(0.24 0.06 135)";

interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "crm";
  text: string;
  timestamp: string;
  badge?: string;
}

interface AutomationConfigSectionProps {
  priceConfig: PriceChangeConfig;
  onUpdatePriceConfig: (next: PriceChangeConfig) => void;
  whatsAppConfig: WhatsAppAIConfig;
  onUpdateWhatsAppConfig: (next: WhatsAppAIConfig) => void;
  properties: PropertyLead[];
  onDispatchBulkPriceSeek: () => void;
  onApplyOwnerCrmUpdate?: (
    propertyId: string,
    newPrice: number,
    statusNote: string,
    crmSummary: string
  ) => void;
}

export function AutomationConfigSection({
  priceConfig,
  onUpdatePriceConfig,
  whatsAppConfig,
  onUpdateWhatsAppConfig,
  properties,
  onDispatchBulkPriceSeek,
  onApplyOwnerCrmUpdate,
}: AutomationConfigSectionProps) {
  const [selectedPreviewLeadId, setSelectedPreviewLeadId] = useState<string>(
    properties[0]?.id ?? "prop-1"
  );
  const [campaignLaunched, setCampaignLaunched] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);

  const previewLead =
    properties.find((p) => p.id === selectedPreviewLeadId) ?? properties[0];

  const liveRenderedMessage = previewLead
    ? renderPriceChangeMessage(
        priceConfig.messageTemplate,
        previewLead,
        priceConfig.targetReductionPercent,
        6
      )
    : "";

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      sender: "ai",
      text: `Monthly Check-In sent to ${previewLead?.ownerName ?? "Carlos Mendoza"}: "${liveRenderedMessage}"`,
      timestamp: "10:00 AM",
      badge: "Monthly Owner Check-In",
    },
    {
      id: "m2",
      sender: "user",
      text: "Hi! Yes, we lowered the asking price to $550,000 this week and painted the front facade.",
      timestamp: "10:02 AM · Property Owner",
    },
    {
      id: "m3",
      sender: "crm",
      text: "Automatic CRM Update: Price changed from $570,000 → $550,000 · Note added: 'Painted the front facade' · Synced with Company System",
      timestamp: "10:02 AM · Auto-Saved to CRM",
      badge: "System Updated",
    },
    {
      id: "m4",
      sender: "ai",
      text: "Thank you Carlos! I have automatically updated Serenity Residential Home to $550,000 and added your exterior paint update in our company system so all our agents have the new details.",
      timestamp: "10:02 AM · WhatsApp AI",
    },
  ]);

  const [testInput, setTestInput] = useState("");

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendTestMessage = (customText?: string) => {
    const textToSend = (customText ?? testInput).trim();
    if (!textToSend || !previewLead) return;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: `${nowTime} · ${previewLead.ownerName}`,
    };

    const crmParsed = parseOwnerMonthlyReplyForCRM(
      textToSend,
      previewLead.price
    );

    const crmMsg: ChatMessage = {
      id: `crm-${Date.now() + 1}`,
      sender: "crm",
      text: `${crmParsed.crmSummary} (${previewLead.title})`,
      timestamp: `${nowTime} · Synced to ${priceConfig.crmSystemName ?? "Company CRM"}`,
      badge: "Auto-Updated in System",
    };

    const aiResult = generateWhatsAppAIReply(
      textToSend,
      whatsAppConfig,
      previewLead
    );

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now() + 2}`,
      sender: "ai",
      text: aiResult.replyText,
      timestamp: `${nowTime} · ${whatsAppConfig.aiPersonaName}`,
    };

    if (onApplyOwnerCrmUpdate) {
      onApplyOwnerCrmUpdate(
        previewLead.id,
        crmParsed.updatedPrice,
        crmParsed.statusNote,
        crmParsed.crmSummary
      );
    }

    setChatMessages((prev) => [...prev, userMsg, crmMsg, aiMsg]);
    if (!customText) setTestInput("");
  };

  return (
    <div className="w-full max-w-[1120px] grid grid-cols-1 gap-3 lg:grid-cols-4">
      {/* Left 2 Columns: Monthly Owner Check-In & Real Estate CRM Auto-Update */}
      <Tile
        title="Monthly Owner WhatsApp Check-In & CRM Auto-Update"
        action={
          <button
            type="button"
            onClick={() =>
              onUpdatePriceConfig({
                ...priceConfig,
                enabled: !priceConfig.enabled,
              })
            }
            className="rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
            style={{
              background: priceConfig.enabled
                ? ACCENT_LIME
                : "var(--color-muted)",
              color: priceConfig.enabled
                ? INK_DARK
                : "var(--color-muted-foreground)",
            }}
          >
            {priceConfig.enabled ? "Monthly Auto-Check On" : "Paused"}
          </button>
        }
        className="lg:col-span-2 flex flex-col justify-between space-y-5"
      >
        <div className="space-y-5">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Automatically Check In with All Property Owners Every Month
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Our WhatsApp AI messages your property owners every month to ask
              if they changed their price or if anything happened with the
              property, and automatically updates your company system and CRM.
            </p>
          </div>

          {/* Connected CRM & Monthly Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="rounded-2xl border border-border bg-background/60 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Database size={14} style={{ color: ACCENT_LIME }} />
                <span>Connected Company CRM</span>
              </div>
              <select
                aria-label="Select connected real estate CRM system"
                value={priceConfig.crmSystemName ?? "Company CRM & Website"}
                onChange={(e) =>
                  onUpdatePriceConfig({
                    ...priceConfig,
                    crmSystemName: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
              >
                <option value="Company CRM & Website">
                  Company CRM & Website (Auto-Sync)
                </option>
                <option value="Vista / Loft Real Estate System">
                  Vista / Loft Real Estate System
                </option>
                <option value="Kenlo / InGaia CRM">Kenlo / InGaia CRM</option>
                <option value="HubSpot / Follow Up Boss">
                  HubSpot / Follow Up Boss
                </option>
              </select>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-3.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar size={14} style={{ color: ACCENT_LIME }} />
                <span>How Often to Message Owners</span>
              </div>
              <select
                aria-label="Select how often to message property owners"
                value={priceConfig.checkInFrequency ?? "Every Month (30 Days)"}
                onChange={(e) =>
                  onUpdatePriceConfig({
                    ...priceConfig,
                    checkInFrequency: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
              >
                <option value="Every Month (30 Days)">
                  Every Month (Every 30 Days)
                </option>
                <option value="1st Monday of Every Month">
                  1st Monday of Every Month
                </option>
                <option value="Every 15 Days">Every 15 Days</option>
              </select>
            </div>
          </div>

          {/* Simple Checkboxes for What the AI Checks & Updates Automatically */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold text-foreground">
              What the AI Checks & Updates in Your System Automatically:
            </p>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 cursor-pointer">
              <div>
                <p className="text-xs font-medium">
                  Update Asking Price Automatically
                </p>
                <p className="text-[11px] text-muted-foreground">
                  If the owner replies with a new price on WhatsApp, update the
                  listing price in the app and company CRM immediately
                </p>
              </div>
              <input
                type="checkbox"
                checked={priceConfig.autoUpdatePortalPrice}
                onChange={(e) =>
                  onUpdatePriceConfig({
                    ...priceConfig,
                    autoUpdatePortalPrice: e.target.checked,
                  })
                }
                className="size-4 accent-[#b8ff3c] shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 cursor-pointer">
              <div>
                <p className="text-xs font-medium">
                  Check if Property Was Sold, Rented, or Still Available
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Automatically mark sold or rented homes so agents never waste
                  time showing unavailable properties
                </p>
              </div>
              <input
                type="checkbox"
                checked={priceConfig.checkAvailability ?? true}
                onChange={(e) =>
                  onUpdatePriceConfig({
                    ...priceConfig,
                    checkAvailability: e.target.checked,
                  })
                }
                className="size-4 accent-[#b8ff3c] shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 cursor-pointer">
              <div>
                <p className="text-xs font-medium">
                  Save New Property Details (Renovations, Repairs, Terms)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Write any updates from the owner directly into the property
                  notes for all agents to see
                </p>
              </div>
              <input
                type="checkbox"
                checked={priceConfig.checkPropertyChanges ?? true}
                onChange={(e) =>
                  onUpdatePriceConfig({
                    ...priceConfig,
                    checkPropertyChanges: e.target.checked,
                  })
                }
                className="size-4 accent-[#b8ff3c] shrink-0"
              />
            </label>
          </div>

          {/* Friendly Monthly Message Template */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="price-template-input"
                className="text-xs font-medium text-muted-foreground"
              >
                Monthly WhatsApp Message Sent to Owners
              </label>
              <select
                aria-label="Select property to preview monthly message"
                value={selectedPreviewLeadId}
                onChange={(e) => setSelectedPreviewLeadId(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-foreground"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.ownerName})
                  </option>
                ))}
              </select>
            </div>
            <textarea
              id="price-template-input"
              rows={3}
              value={priceConfig.messageTemplate}
              onChange={(e) =>
                onUpdatePriceConfig({
                  ...priceConfig,
                  messageTemplate: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="rounded-2xl bg-muted/40 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Preview for {previewLead?.ownerName} (
                  {previewLead?.ownerPhone})
                </span>
                <span
                  className="font-mono text-[10px] font-semibold"
                  style={{ color: ACCENT_LIME }}
                >
                  Monthly Check-In
                </span>
              </div>
              <p className="text-xs leading-relaxed text-foreground">
                {liveRenderedMessage}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onDispatchBulkPriceSeek();
            setCampaignLaunched(true);
            window.setTimeout(() => setCampaignLaunched(false), 3000);
          }}
          className="mt-4 w-full rounded-2xl py-3.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.99] whitespace-nowrap"
          style={{ background: ACCENT_LIME, color: INK_DARK }}
        >
          {campaignLaunched ? (
            <>
              <CheckCircle2 size={16} />
              Monthly Check-In Sent to All {properties.length} Property Owners &
              CRM Synced!
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Send Monthly Check-In to All {properties.length} Property Owners
              Now
            </>
          )}
        </button>
      </Tile>

      {/* Right 2 Columns: Live WhatsApp AI Assistant & Automatic System Updates */}
      <Tile
        title="24/7 WhatsApp AI Assistant & Live CRM Sync"
        action={
          <Pills
            label="WhatsApp AI Availability"
            value={whatsAppConfig.enabled247 ? "24/7 Active" : "Business Hours"}
            options={["24/7 Active", "Business Hours"]}
            onChange={(v) =>
              onUpdateWhatsAppConfig({
                ...whatsAppConfig,
                enabled247: v === "24/7 Active",
              })
            }
          />
        }
        className="lg:col-span-2 flex flex-col justify-between space-y-4"
      >
        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Reads Owner Replies on WhatsApp & Updates Your System
              Automatically
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              When a property owner replies on WhatsApp at any hour, the AI
              answers politely and writes the new price or property update
              straight into your real estate system.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-y border-border py-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">
                Assistant Name
              </span>
              <input
                type="text"
                aria-label="WhatsApp Assistant Name"
                value={whatsAppConfig.aiPersonaName}
                onChange={(e) =>
                  onUpdateWhatsAppConfig({
                    ...whatsAppConfig,
                    aiPersonaName: e.target.value,
                  })
                }
                className="mt-0.5 w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none"
              />
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block">
                Current Listing Price
              </span>
              <p
                className="mt-0.5 font-mono text-xs sm:text-sm font-semibold tabular-nums"
                style={{ color: ACCENT_LIME }}
              >
                ${previewLead?.price.toLocaleString("en-US")}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block">
                CRM Sync Status
              </span>
              <p className="mt-0.5 text-xs font-semibold text-emerald-400">
                Connected & Live
              </p>
            </div>
          </div>

          {/* Interactive WhatsApp + Automatic CRM Sync Feed */}
          <div className="rounded-2xl bg-background/70 p-4 flex flex-col h-[360px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Bot size={15} />
                </span>
                <div>
                  <p className="text-xs font-semibold">
                    {whatsAppConfig.aiPersonaName} · Connected to{" "}
                    {priceConfig.crmSystemName ?? "Company CRM"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Property: {previewLead?.title} · Owner:{" "}
                    {previewLead?.ownerName}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 whitespace-nowrap">
                24/7 Auto-Sync
              </span>
            </div>

            <div
              ref={chatListRef}
              className="flex-1 overflow-y-auto space-y-2.5 pr-1"
            >
              {chatMessages.map((msg) => {
                if (msg.sender === "crm") {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-start gap-2"
                      style={{
                        background:
                          "color-mix(in oklch, oklch(0.89 0.2 128) 14%, transparent)",
                        border:
                          "1px solid color-mix(in oklch, oklch(0.89 0.2 128) 40%, transparent)",
                        color: ACCENT_LIME,
                      }}
                    >
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{msg.text}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-foreground text-background"
                          : "bg-card text-card-foreground border border-border"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Friendly 1-Click Owner Reply Examples */}
            <div className="mt-3 pt-2.5 border-t border-border flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleSendTestMessage(
                    "We changed the asking price to $540,000 this month"
                  )
                }
                className="rounded-full border border-border bg-muted/40 hover:bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Owner Replies: “Changed price to $540,000”
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendTestMessage(
                    "Still available! We just renovated the kitchen and pool area."
                  )
                }
                className="rounded-full border border-border bg-muted/40 hover:bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Owner Replies: “Renovated kitchen & pool”
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendTestMessage("The property was rented yesterday.")
                }
                className="rounded-full border border-border bg-muted/40 hover:bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Owner Replies: “Property was rented”
              </button>
            </div>
          </div>
        </div>

        {/* Custom Message Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTestMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            aria-label="Test an owner reply on WhatsApp to see the CRM update automatically"
            placeholder="Type an owner's WhatsApp reply (e.g. 'New price is $535,000')..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="rounded-2xl px-4 py-3 text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-[0.98] whitespace-nowrap shrink-0"
            style={{ background: ACCENT_LIME, color: INK_DARK }}
          >
            <Send size={14} />
            Test Reply
          </button>
        </form>
      </Tile>
    </div>
  );
}
