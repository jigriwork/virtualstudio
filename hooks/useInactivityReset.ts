"use client";

import { useEffect } from "react";

export function useInactivityReset(timeoutMs: number, onReset: () => void) {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onReset, timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "touchstart", "keydown"];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [onReset, timeoutMs]);
}
