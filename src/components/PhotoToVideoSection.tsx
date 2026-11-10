import React, { useState, useEffect } from "react";
import { Tile, Pills } from "./ui/web3-bento";
import type { PropertyLead } from "../utils/automationEngine";
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Film,
  Send,
  CheckCircle2,
  Volume2,
  Maximize2,
} from "lucide-react";

const ACCENT_LIME = "oklch(0.89 0.2 128)";
const INK_DARK = "oklch(0.24 0.06 135)";

interface PhotoToVideoSectionProps {
  properties: PropertyLead[];
  selectedProperty: PropertyLead;
  onSelectProperty: (prop: PropertyLead) => void;
  onMarkVideoDispatched: (propId: string) => void;
}

export function PhotoToVideoSection({
  properties,
  selectedProperty,
  onSelectProperty,
  onMarkVideoDispatched,
}: PhotoToVideoSectionProps) {
  const [customUploadedImage, setCustomUploadedImage] = useState<string | null>(
    null
  );
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [cameraMotion, setCameraMotion] = useState<string>("Cinematic Drone");
  const [aspectRatio, setAspectRatio] = useState<string>("9:16 Reel");
  const [voiceoverStyle, setVoiceoverStyle] = useState<string>(
    "Luxury Architectural"
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [videoGeneratedCount, setVideoGeneratedCount] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [sharedToWhatsApp, setSharedToWhatsApp] = useState<boolean>(false);

  const activeImageUrl = customUploadedImage ?? selectedProperty.imageUrl;

  useEffect(() => {
    if (!isPlaying || isGenerating) return;
    const timer = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 150);
    return () => window.clearInterval(timer);
  }, [isPlaying, isGenerating]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomUploadedImage(reader.result);
        setCustomFileName(file.name);
        triggerVideoRender();
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerVideoRender = () => {
    setIsGenerating(true);
    setProgress(0);
    setSharedToWhatsApp(false);
    window.setTimeout(() => {
      setIsGenerating(false);
      setIsPlaying(true);
      setVideoGeneratedCount((c) => c + 1);
    }, 450);
  };

  const sceneCaption =
    progress < 33
      ? `Architectural Exterior & Arrival · ${selectedProperty.title}`
      : progress < 66
        ? `${selectedProperty.bedrooms} Bedrooms · ${selectedProperty.bathrooms} Baths · ${selectedProperty.areaSqm}m² Living Space`
        : `Private Showing Available via 24/7 WhatsApp · $${selectedProperty.price.toLocaleString("en-US")}`;

  return (
    <div className="w-full max-w-[1120px] grid grid-cols-1 gap-3 lg:grid-cols-4">
      {/* Left 2 Columns: Upload Property Photo & Configure Selling Video */}
      <Tile
        title="Photo-to-Selling-Video Engine · Upload & Configure"
        action={
          <span className="font-mono text-[11px] text-emerald-400">
            Instant AI Video Response
          </span>
        }
        className="lg:col-span-2 flex flex-col justify-between space-y-5"
      >
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Turn Property Photos into High-Converting Selling Videos
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload any room or exterior photo — the platform responds
              immediately with a motion-tracked selling video ready for WhatsApp
              & Reels.
            </p>
          </div>

          {/* Drag & Drop / File Upload Zone */}
          <label
            htmlFor="property-photo-upload"
            className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-[#b8ff3c] bg-background/50 p-6 text-center cursor-pointer transition-colors"
          >
            <input
              id="property-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
            <div className="grid size-11 place-items-center rounded-2xl bg-muted text-foreground group-hover:scale-105 transition-transform">
              <Upload size={20} />
            </div>
            <p className="mt-3 text-xs font-semibold">
              {customFileName
                ? `Uploaded: ${customFileName} (Click to replace)`
                : "Upload Property Photo (JPG, PNG, WEBP)"}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              Or select one of the extracted listing photos below
            </p>
          </label>

          {/* Property Photo Presets */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Select Listing Photo from Extracted Leads
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {properties.slice(0, 4).map((prop) => {
                const isSelected =
                  !customUploadedImage && prop.id === selectedProperty.id;
                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => {
                      setCustomUploadedImage(null);
                      setCustomFileName(null);
                      onSelectProperty(prop);
                      triggerVideoRender();
                    }}
                    className={`group relative rounded-xl overflow-hidden border text-left transition-all ${
                      isSelected
                        ? "border-[#b8ff3c] ring-2 ring-[#b8ff3c]/40"
                        : "border-border opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="h-16 w-full bg-muted overflow-hidden">
                      <img
                        src={prop.imageUrl}
                        alt={prop.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-1.5 bg-card">
                      <p className="truncate text-[10px] font-semibold">
                        {prop.title}
                      </p>
                      <p className="font-mono text-[9px] text-muted-foreground tabular-nums">
                        ${prop.price.toLocaleString("en-US")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Motion & Format Controls (clean hairline rows, zero overflow) */}
          <div className="border-t border-border pt-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-foreground block">
                  3D Camera Motion Path
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Depth-mapped parallax trajectory
                </span>
              </div>
              <Pills
                label="Camera Motion"
                value={cameraMotion}
                options={["Cinematic Drone", "Pan & Reveal", "Orbital"]}
                onChange={setCameraMotion}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3.5">
              <div>
                <span className="text-xs font-medium text-foreground block">
                  Output Aspect Ratio
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Formatted for WhatsApp Status, Reels & YouTube
                </span>
              </div>
              <Pills
                label="Output Aspect Ratio"
                value={aspectRatio}
                options={["9:16 Reel", "16:9 Tour"]}
                onChange={setAspectRatio}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3.5">
              <div>
                <span className="text-xs font-medium text-foreground block">
                  AI Voiceover & Dynamic Captions
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Auto-narrates bedrooms, m², and price badge
                </span>
              </div>
              <Pills
                label="Voiceover Style"
                value={voiceoverStyle}
                options={["Luxury Architectural", "High-Energy"]}
                onChange={setVoiceoverStyle}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerVideoRender}
          disabled={isGenerating}
          className="w-full rounded-2xl py-3.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          style={{ background: ACCENT_LIME, color: INK_DARK }}
        >
          <Sparkles size={16} className={isGenerating ? "animate-spin" : ""} />
          {isGenerating
            ? "Synthesizing 3D Camera Motion & Selling Video..."
            : "Generate Selling Video from Photo"}
        </button>
      </Tile>

      {/* Right 2 Columns: Website Responds with Interactive Selling Video Player */}
      <Tile
        title={`Generated Selling Video #${videoGeneratedCount} · ${cameraMotion} (${aspectRatio})`}
        action={
          <span className="font-mono text-[11px] text-muted-foreground">
            1080p · 60fps AI Render
          </span>
        }
        className="lg:col-span-2 flex flex-col justify-between"
      >
        {/* Interactive Video Viewport */}
        <div className="relative flex-1 flex items-center justify-center rounded-2xl border border-border bg-black/90 overflow-hidden min-h-[380px] p-3">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-center p-8">
              <Film size={32} className="animate-spin text-[#b8ff3c]" />
              <p className="text-sm font-semibold">
                Converting Photo into Selling Video...
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Building depth map, camera dolly & luxury lower-thirds
              </p>
            </div>
          ) : (
            <div
              className={`relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl transition-all duration-300 ${
                aspectRatio === "9:16 Reel"
                  ? "w-[260px] h-[390px]"
                  : "w-full h-[320px]"
              }`}
            >
              {/* Animated Motion Picture Frame from Uploaded/Selected Photo */}
              <img
                src={activeImageUrl}
                alt={`Selling video for ${selectedProperty.title}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={{
                  transform: isPlaying
                    ? `scale(${1.04 + (progress / 100) * 0.14}) translate(${
                        cameraMotion === "Pan & Reveal"
                          ? `${-3 + (progress / 100) * 6}%`
                          : "0%"
                      }, ${-1.5 + (progress / 100) * 3}%)`
                    : "scale(1.06)",
                  transition: "transform 180ms linear",
                }}
              />

              {/* Measured Contrast Scrim for Video Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

              {/* Top Video HUD */}
              <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between">
                <span className="rounded-full bg-black/65 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] font-semibold text-white">
                  AI SELLING REEL · {selectedProperty.cityName}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums"
                  style={{ background: ACCENT_LIME, color: INK_DARK }}
                >
                  ${selectedProperty.price.toLocaleString("en-US")}
                </span>
              </div>

              {/* Lower-Thirds Animated Caption & Specs */}
              <div className="absolute bottom-3.5 inset-x-3.5 space-y-2 text-white">
                <div className="rounded-xl bg-black/60 backdrop-blur-md p-2.5 border border-white/10">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                    {voiceoverStyle} Voiceover
                  </p>
                  <p className="text-xs font-semibold leading-snug mt-0.5">
                    “{sceneCaption}”
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono px-1">
                  <span>
                    {selectedProperty.bedrooms} BD · {selectedProperty.bathrooms}{" "}
                    BA · {selectedProperty.areaSqm}m²
                  </span>
                  <span>Agent: {selectedProperty.assignedAgent}</span>
                </div>

                {/* Scrubber bar inside player */}
                <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: ACCENT_LIME,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Playback & WhatsApp Dispatch Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? "Pause selling video" : "Play selling video"}
              className="rounded-xl border border-border bg-muted/60 hover:bg-muted px-3 py-2 text-xs font-medium flex items-center gap-1.5"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setIsPlaying(true);
              }}
              aria-label="Restart selling video"
              className="rounded-xl border border-border bg-muted/60 hover:bg-muted p-2 text-xs"
            >
              <RotateCcw size={14} />
            </button>
            <span className="font-mono text-xs text-muted-foreground tabular-nums ml-1 flex items-center gap-1">
              <Volume2 size={13} />
              00:{String(Math.floor((progress / 100) * 15)).padStart(2, "0")} /
              00:15
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onMarkVideoDispatched(selectedProperty.id);
              setSharedToWhatsApp(true);
            }}
            className="rounded-2xl px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-[0.98] whitespace-nowrap"
            style={{ background: ACCENT_LIME, color: INK_DARK }}
          >
            {sharedToWhatsApp ? (
              <>
                <CheckCircle2 size={14} />
                Dispatched Video to WhatsApp Leads
              </>
            ) : (
              <>
                <Send size={14} />
                Send Video on WhatsApp 24/7
              </>
            )}
          </button>
        </div>
      </Tile>
    </div>
  );
}
