"use client";

import { ChevronRightIcon, CloseIcon } from "@/components/icons";
import { Button, Modal } from "@/components/ui";
import type { ApiListing } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function ListingThumb({
  listing,
  className,
}: {
  listing: ApiListing;
  className?: string;
}) {
  if (listing.productImage) {
    return (
      <div
        className={cn(
          "shrink-0 rounded-[14px] bg-mint bg-cover bg-center",
          className,
        )}
        style={{ backgroundImage: `url(${listing.productImage})` }}
        role="img"
        aria-label={listing.documents[0]?.name || listing.brand}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[14px] bg-mint",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_15%_0%,rgba(255,255,255,0.55),transparent_62%)]" />
    </div>
  );
}

export function ListingPreview({
  listing,
  onClose,
}: {
  listing: ApiListing | null;
  onClose: () => void;
}) {
  const document = listing?.documents[0];
  const name = document?.name || listing?.slug || listing?.brand;
  const categories = document?.metadata?.category ?? [];

  return (
    <Modal
      open={Boolean(listing)}
      onClose={onClose}
      labelledBy="listing-modal-title"
      className="sm:max-w-[680px]"
    >
      {listing ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                Healthlist listing
              </p>
              <h2
                id="listing-modal-title"
                className="mt-2 font-serif text-[34px] leading-tight sm:text-[38px]"
              >
                {name}
              </h2>
              <p className="mt-1.5 text-[15px] text-muted">
                by {listing.brand}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-[#f2f4f5] hover:text-foreground"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
            <ListingThumb
              listing={listing}
              className="h-[230px] w-full rounded-[16px]"
            />
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {document?.metadata?.price != null ? (
                  <p className="font-serif text-[32px] leading-none">
                    ${document.metadata.price}
                  </p>
                ) : (
                  <p className="font-serif text-[32px] leading-none">
                    {listing.brand}
                  </p>
                )}
                <p className="text-sm text-muted">{listing.reviews} reviews</p>
              </div>

              {categories.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-[#f2f6f6] px-2.5 py-1 text-[11px] text-[#4e6a6e]"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">
                {document?.excerpt ||
                  document?.body ||
                  "No listing details are available yet."}
              </p>
            </div>
          </div>

          <Button size="lg" className="mt-6 w-full" onClick={onClose}>
            Back to request
            <ChevronRightIcon className="size-4" />
          </Button>
        </>
      ) : null}
    </Modal>
  );
}
