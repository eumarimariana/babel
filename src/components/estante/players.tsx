"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useRef, useSyncExternalStore } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Journey, JOURNEY, type JourneyProps } from "@/remotion/Journey";
import { Celebration, CELEBRATION, type CelebrationProps } from "@/remotion/Celebration";

const reducedQuery = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(reducedQuery);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(reducedQuery).matches,
    () => false,
  );
}

/** Shared playback props: play once, stay on the last frame, skip the motion for reduced-motion users. */
function usePlayback(durationInFrames: number) {
  const reduced = useReducedMotion();
  return {
    autoPlay: !reduced,
    initialFrame: reduced ? durationInFrames - 1 : 0,
    initiallyMuted: true,
    moveToBeginningWhenEnded: false,
    clickToPlay: false,
    acknowledgeRemotionLicense: true,
  } as const;
}

export function JourneyPlayer(props: JourneyProps) {
  const ref = useRef<PlayerRef>(null);
  const playback = usePlayback(JOURNEY.durationInFrames);
  return (
    <div className="relative bg-[#e9e5df]">
      <Player
        ref={ref}
        component={Journey}
        inputProps={props}
        durationInFrames={JOURNEY.durationInFrames}
        fps={JOURNEY.fps}
        compositionWidth={JOURNEY.width}
        compositionHeight={JOURNEY.height}
        style={{ width: "100%", aspectRatio: `${JOURNEY.width} / ${JOURNEY.height}` }}
        {...playback}
      />
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Repetir animação"
        className="absolute top-2 right-2 text-[#6b6863] hover:bg-[#d9d3cb] hover:text-[#1c1d1f]"
        onClick={() => {
          ref.current?.seekTo(0);
          ref.current?.play();
        }}
      >
        <ArrowCounterClockwiseIcon />
      </Button>
    </div>
  );
}

export function CelebrationPlayer(props: CelebrationProps) {
  const playback = usePlayback(CELEBRATION.durationInFrames);
  return (
    <div className="overflow-hidden rounded-xl bg-[#e9e5df]">
      <Player
        component={Celebration}
        inputProps={props}
        durationInFrames={CELEBRATION.durationInFrames}
        fps={CELEBRATION.fps}
        compositionWidth={CELEBRATION.width}
        compositionHeight={CELEBRATION.height}
        style={{ width: "100%", aspectRatio: `${CELEBRATION.width} / ${CELEBRATION.height}` }}
        {...playback}
      />
    </div>
  );
}
