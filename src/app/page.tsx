
"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { isMobile } from "@/utils/device";

export default function Home() {
  // Cursor effect for desktop
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isMobile()) return;
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };
    document.addEventListener("mousemove", moveCursor);
    return () => document.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col bg-[#c4af9d] overflow-hidden"
      style={{ fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif' }}
    >
      {/* Favicon top left */}
      <a href="/" className="absolute top-2 left-2 z-10" aria-label="Home">
        <Image src="/favicon.ico" alt="Favicon" width={160} height={100} priority />
      </a>

      {/* Color picker spheres top right and Shop/Bag buttons */}
      <div className="absolute top-6 right-8 flex flex-col items-end gap-2 z-20">
        <div className="flex items-center gap-2">
          {/* White sphere */}
          <div className="w-5 h-5 rounded-full bg-white border border-gray-300 shadow" />
          {/* Black sphere */}
          <div className="w-7 h-7 rounded-full bg-black border-2 border-gray-700 shadow" />
          {/* Green sphere */}
          <div className="w-5 h-5 rounded-full bg-green-600 border border-green-900 shadow" />
        </div>
        {/* Shop and Bag buttons */}
        <div className="flex gap-8 mt-4">
          <button className="underline-anim-btn text-3xl font-serif relative px-2 focus:outline-none group">
            Shop
            <span className="underline-anim active" />
          </button>
          <button className="underline-anim-btn text-3xl font-serif relative px-2 focus:outline-none group">
            Bag
            <span className="underline-anim" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-1 w-full h-screen">
        {/* Large MUSI'S text with registered mark */}
        <div className="relative w-full flex flex-col items-center">
          <h1
            className="text-green-600 text-[13vw] font-black uppercase tracking-tight text-center select-none leading-none"
            style={{
              fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
            }}
          >
            MUSI'S
            <span
              style={{
                fontSize: '0.18em',
                position: 'absolute',
                top: '0.18em',
                right: '-1.5em',
                color: '#222',
                border: '2px solid #222',
                borderRadius: '50%',
                width: '1.1em',
                height: '1.1em',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#c4af9d',
                fontWeight: 900,
                zIndex: 10,
              }}
              aria-label="Registered Trademark"
            >
              ®
            </span>
          </h1>
          
          {/* Thick underline and bottom info */}
          <div className="w-[90vw] h-4 bg-green-600 rounded-full mt-4 relative">
            {/* Bottom row: all in one line using flex */}
            <div className="flex flex-row justify-between items-center w-full px-2 absolute left-0 -bottom-8">
              <span className="text-base font-sans text-gray-800 select-none whitespace-nowrap">
                Shoe Collection
              </span>
              <span className="text-base font-sans text-gray-800 select-none whitespace-nowrap">
                Original Tough Leather
              </span>
              <button className="text-base font-sans text-gray-800 underline-anim-btn px-2 group whitespace-nowrap">
                Who made the website ?
                <span className="underline-anim" />
              </button>
            </div>
          </div>
              {/* Animated underline CSS */}
              <style jsx global>{`
                .underline-anim-btn {
                  background: none;
                  border: none;
                  cursor: pointer;
                  position: relative;
                  padding-bottom: 0.2em;
                }
                .underline-anim {
                  display: block;
                  position: absolute;
                  left: 0;
                  bottom: -2px;
                  height: 4px;
                  width: 100%;
                  background: #16a34a;
                  border-radius: 2px;
                  transform: scaleX(0);
                  transform-origin: left;
                  transition: transform 0.35s cubic-bezier(0.77,0,0.175,1);
                  z-index: 1;
                }
                .underline-anim-btn:hover .underline-anim,
                .underline-anim-btn:focus .underline-anim {
                  transform: scaleX(1);
                }
                .underline-anim-btn .underline-anim.active {
                  transform: scaleX(1);
                }
              `}</style>
        </div>
      </main>

      {/* Green dot cursor for desktop only */}
      {!isMobile() && (
        <div
          ref={cursorRef}
          className="pointer-events-none fixed z-50"
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#16a34a',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 12px 2px #16a34a88',
            transition: 'left 0.08s, top 0.08s',
            left: 0,
            top: 0,
            opacity: 0.95,
          }}
        />
      )}
    </div>
  );
}
