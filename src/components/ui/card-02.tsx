import React, { useState } from "react";
import { ArrowRight, Bath, BedDouble, Expand, Home } from "lucide-react";

export interface PreviewCardProps {
  title?: string;
  address?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  imageUrl?: string;
  onCardClick?: () => void;
  footerSlot?: React.ReactNode;
}

/**
 * Exact implementation of 21st.dev/@shadcnspace/components/card-02 (Property Preview Card)
 */
export function PreviewCard({
  title = "Serenity Residential Home",
  address = "15 S Aurora Ave, Miami",
  price = "$570,000",
  bedrooms = 5,
  bathrooms = 3,
  areaSqm = 120,
  imageUrl = "/src/assets/images/property_serenity_miami_1794336589623.jpg",
  onCardClick,
  footerSlot,
}: PreviewCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative gap-0 py-0 rounded-2xl group hover:shadow-3xl duration-300 border border-border bg-card text-card-foreground flex flex-col overflow-hidden">
      <div className="overflow-hidden rounded-t-2xl relative">
        <button
          type="button"
          onClick={onCardClick}
          aria-label={`Inspect property ${title}`}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="w-full h-72 bg-muted relative overflow-hidden">
            {!imgError ? (
              <img
                src={imageUrl}
                alt={title}
                width={440}
                height={300}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover rounded-t-2xl group-hover:brightness-50 group-hover:scale-125 transition duration-300 delay-75"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-muted-foreground gap-2">
                <Home size={32} />
                <span className="text-xs font-mono">{title}</span>
              </div>
            )}
          </div>
        </button>
        <div
          onClick={onCardClick}
          className="absolute top-6 right-6 hidden p-4 bg-white rounded-full group-hover:block cursor-pointer shadow-lg"
        >
          <ArrowRight className="text-neutral-900" size={20} />
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-5 mb-6">
            <div>
              <button
                type="button"
                onClick={onCardClick}
                className="text-left focus-visible:outline-none"
              >
                <h3 className="text-xl font-medium duration-300 group-hover:text-primary">
                  {title}
                </h3>
              </button>
              <p className="text-base font-normal text-muted-foreground mt-0.5">
                {address}
              </p>
            </div>
            <span className="px-5 py-3 text-base font-normal rounded-full bg-teal-500/10 text-teal-500 font-mono tabular-nums shrink-0">
              {price}
            </span>
          </div>

          <div className="flex">
            <div className="flex flex-col gap-2 pr-5 sm:pr-6 border-e border-border">
              <BedDouble size={20} />
              <p className="text-sm sm:text-base whitespace-nowrap">
                {bedrooms} Bedrooms
              </p>
            </div>
            <div className="flex flex-col gap-2 px-5 sm:px-6 border-e border-border">
              <Bath size={20} />
              <p className="text-sm sm:text-base whitespace-nowrap">
                {bathrooms} Bathrooms
              </p>
            </div>
            <div className="flex flex-col gap-2 pl-5 sm:pl-6">
              <Expand size={20} />
              <p className="text-sm sm:text-base whitespace-nowrap font-mono tabular-nums">
                {areaSqm}m<sup>2</sup>
              </p>
            </div>
          </div>
        </div>

        {footerSlot && (
          <div className="mt-5 pt-4 border-t border-border">{footerSlot}</div>
        )}
      </div>
    </div>
  );
}
