"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Re-renders the Page on the server whenever the Editor saves in the Live
 * Preview's admin window, so the iframe shows the new Draft.
 *
 * The admin runs on the same origin as the site, so this window's origin is
 * the one Payload's messages must come from. It is only known in the browser.
 */
export function RefreshOnSave() {
  const router = useRouter();
  const origin = useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => null,
  );

  if (!origin) return null;
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={origin} />;
}
