/** DOM ids on `DoubleScreen` sections — scroll the window to each half of the home layout. */

export const HOME_VIEWPORT_TOP_ID = "home-viewport-top";
export const HOME_VIEWPORT_BOTTOM_ID = "home-viewport-bottom";

export function scrollToHomeTopHalf(behavior: ScrollBehavior = "smooth") {
  if (typeof document === "undefined") return;
  document.getElementById(HOME_VIEWPORT_TOP_ID)?.scrollIntoView({ behavior, block: "start" });
}

export function scrollToHomeBottomHalf(behavior: "auto" | "smooth" = "smooth") {
  if (typeof document === "undefined") return;
  document.getElementById(HOME_VIEWPORT_BOTTOM_ID)?.scrollIntoView({ behavior, block: "start" });
}
