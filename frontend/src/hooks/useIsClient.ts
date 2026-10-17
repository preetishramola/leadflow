import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during server rendering / prerendering, true once running in the browser. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
