"use client";

import { useEffect, useState } from "react";

export type OgMetadata = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  publisher?: string;
};

const cache = new Map<string, OgMetadata | null>();
const inflight = new Map<string, Promise<OgMetadata | null>>();

async function fetchOg(url: string): Promise<OgMetadata | null> {
  if (cache.has(url)) return cache.get(url) ?? null;
  if (inflight.has(url)) return inflight.get(url)!;

  const promise = (async () => {
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.status !== "success") return null;
      const data = json.data ?? {};
      return {
        title: data.title,
        description: data.description,
        image: data.image?.url,
        url: data.url,
        publisher: data.publisher,
      } satisfies OgMetadata;
    } catch {
      return null;
    }
  })();

  inflight.set(url, promise);
  const result = await promise;
  cache.set(url, result);
  inflight.delete(url);
  return result;
}

export function useOgMetadata(url: string | null, enabled: boolean) {
  const [data, setData] = useState<OgMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url || !enabled) return;
    if (cache.has(url)) {
      setData(cache.get(url) ?? null);
      return;
    }
    setLoading(true);
    let active = true;
    fetchOg(url).then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [url, enabled]);

  return { data, loading };
}
