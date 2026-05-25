"use client";

import { useEffect, useRef, useState } from "react";
import { useOgMetadata } from "@/hooks/useOgMetadata";
import { detectPlatform } from "@/lib/link-utils";
import { PlatformIcon } from "./PlatformIcon";

export function LinkPreview({ url }: { url: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [inView, setInView] = useState(false);
  const { data, loading } = useOgMetadata(url, inView);
  const platform = detectPlatform(url);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {}

  return (
    <a
      ref={ref}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-lg border border-gray-200 transition hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-gray-600"
    >
      {data?.image && (
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <PlatformIcon platform={platform} size={12} />
          <span className="truncate">{data?.publisher || hostname}</span>
        </div>
        {loading && !data && (
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        )}
        {data?.title && (
          <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.title}
          </p>
        )}
        {data?.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
            {data.description}
          </p>
        )}
        {!loading && !data && (
          <p className="truncate text-sm text-gray-700 dark:text-gray-300">{url}</p>
        )}
      </div>
    </a>
  );
}
