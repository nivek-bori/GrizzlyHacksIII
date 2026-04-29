type HorizontalSplitMode = "fixed" | "content";

type HorizontalSplitProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  mode?: HorizontalSplitMode;
};

export default function ScreenHorizontalSplit({ left, right, mode = "fixed" }: HorizontalSplitProps) {
  const containerClass =
    mode === "fixed"
      ? "relative min-h-0 h-full w-full flex-1 overflow-hidden"
      : "w-full grid grid-cols-2 gap-2 items-start";

  const leftClass =
    mode === "fixed"
      ? "absolute inset-y-0 z-10 flex w-1/2 min-h-0 flex-col overflow-y-auto"
      : "min-w-0";

  const rightClass =
    mode === "fixed"
      ? "absolute inset-y-0 right-0 z-0 flex w-1/2 min-h-0 flex-col overflow-y-auto"
      : "min-w-0";

  return (
    <div className={containerClass}>
      {/* left half */}
      <div className={leftClass}>
        { left }
      </div>
      
      {/* right half */}
      <div className={rightClass}>
        { right }
      </div>
    </div>
  )
}