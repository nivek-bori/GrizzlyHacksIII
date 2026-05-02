"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { scrollToHomeBottomHalf, scrollToHomeTopHalf } from "@/lib/util/scrollViewport";

export default function ScrollHalfFab() {
  const [viewingLowerHalf, setViewingLowerHalf] = useState(false);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const h = window.innerHeight;
      setViewingLowerHalf(y > h / 2);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (viewingLowerHalf) {
    return (
      <button
        type="button"
        aria-label="Scroll to top of page"
        onClick={() => scrollToHomeTopHalf("smooth")}
        className="pointer-events-auto fixed left-1/2 z-50 flex h-12 w-12 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-gray-900 shadow-lg top-[max(1rem,env(safe-area-inset-top,0px))]"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Scroll to bottom of page"
      onClick={() => scrollToHomeBottomHalf("smooth")}
      className="pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex h-12 w-12 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-gray-900 shadow-lg"
    >
      <ArrowDown className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
