"use client";

import * as React from "react";
import { CSSProperties, DetailedHTMLProps, HTMLAttributes } from "react";

type LengthType = number | string;

interface LoaderSizeMarginProps extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  color?: string;
  loading?: boolean;
  cssOverride?: CSSProperties;
  speedMultiplier?: number;  
  size?: LengthType;
  margin?: LengthType;
 }

  
export const createAnimation = (loaderName: string, frames: string, suffix: string): string => {
  const animationName = `react-spinners-${loaderName}-${suffix}`;

  if (typeof window == "undefined" || !window.document) {
    return animationName;
  }

  const styleEl = document.createElement("style");
  document.head.appendChild(styleEl);
  const styleSheet = styleEl.sheet;

  const keyFrames = `
    @keyframes ${animationName} {
      ${frames}
    }
  `;

  if (styleSheet) {
    styleSheet.insertRule(keyFrames, 0);
  }

  return animationName;
};

const beat = createAnimation(
  "BeatLoader",
  "50% {transform: scale(0.75);opacity: 0.2} 100% {transform: scale(1);opacity: 1}",
  "beat"
);

function LoadingComponent({
  loading = true,
  color = "#000000",
  speedMultiplier = 1,
  cssOverride = {},
  size = 1.3,
  margin = 2,
  ...additionalprops
}: LoaderSizeMarginProps) {
  const wrapper: React.CSSProperties = {
    display: "inherit",
    ...cssOverride,
  };

  const style = (i: number): React.CSSProperties => {
    return {
      display: "inline-block",
      backgroundColor: color,
      width: `${size}rem`,
      height: `${size}rem`,
      margin: `${margin}px`,
      borderRadius: "100%",
      animation: `${beat} ${0.7 / speedMultiplier}s ${`${[0.0, 0.233333, 0.466666].at(i) ?? 0 / speedMultiplier}s`} infinite linear`,
      animationFillMode: "both",
    };
  };

  if (!loading) {
    return null;
  }

  return (
    <div className='h-full w-full flex flex-col justify-center items-center'>
      <span style={wrapper} {...additionalprops}>
        <span style={style(1)} />
        <span style={style(2)} />
        <span style={style(3)} />
      </span>
      <div className='mt-2 flex items-center bg-red-500'>
        Loading...
      </div>
    </div>
  );
}

export default LoadingComponent;