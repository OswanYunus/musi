"use client";

import { useEffect, useMemo, useState } from "react";

const NAIROBI_OFFSET_MINUTES = 3 * 60;
const OPEN_HOUR = 7;
const OPEN_MINUTE = 30;
const CLOSE_HOUR = 17;
const CLOSE_MINUTE = 0;

function getNairobiDate(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + NAIROBI_OFFSET_MINUTES * 60000);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getCountDownState(now: Date) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const openTime = new Date(today);
  openTime.setHours(OPEN_HOUR, OPEN_MINUTE, 0, 0);

  const closeTime = new Date(today);
  closeTime.setHours(CLOSE_HOUR, CLOSE_MINUTE, 0, 0);

  const isOpen = now >= openTime && now < closeTime;
  let target = isOpen ? closeTime : openTime;

  if (!isOpen) {
    if (now >= closeTime) {
      target = new Date(openTime.getTime() + 24 * 60 * 60000);
    }
  }

  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    status: isOpen ? "Open" : "Closed",
    countdown: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  };
}

export default function WorkHoursTimer({ color }: { color?: string }) {
  const [now, setNow] = useState(() => getNairobiDate());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(getNairobiDate()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { status, countdown } = useMemo(() => getCountDownState(now), [now]);

  return (
    <div className="flex flex-col items-center sm:items-end gap-1 text-right" style={{ color }}>
      <span className="text-xs uppercase tracking-[0.35em] font-sans" style={{ opacity: 0.9 }}>
        {status === "Open" ? "We're open" : "We're closed"}
      </span>
      <span className="font-black text-[4rem] leading-none tracking-[-0.03em] sm:text-[5.5rem]">
        {countdown}
      </span>
    </div>
  );
}
