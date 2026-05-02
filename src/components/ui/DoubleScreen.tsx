import { HOME_VIEWPORT_BOTTOM_ID, HOME_VIEWPORT_TOP_ID } from "@/lib/util/scrollViewport";

export default function DoubleScreen({ top, bottom }: { top: React.ReactNode; bottom: React.ReactNode }) {
  return (
    <div className="w-full">
      <div id={HOME_VIEWPORT_TOP_ID} className="h-screen w-full scroll-mt-0">
        {top}
      </div>
      <div id={HOME_VIEWPORT_BOTTOM_ID} className="h-screen w-full scroll-mt-0">
        {bottom}
      </div>
    </div>
  );
}