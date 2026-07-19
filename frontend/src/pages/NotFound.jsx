import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col antialiased relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, #1f2a3c 0%, transparent 60%)' }}
      />

      <header className="bg-surface/40 backdrop-blur-xl border-b border-white/15 sticky top-0 flex flex-col justify-center px-container-margin w-full h-24 z-50">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-secondary-fixed text-headline-lg-mobile"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sports_soccer
            </span>
            <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface tracking-tight">
              StadiumIQ
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-between relative z-10 px-container-margin py-xl w-full max-w-md mx-auto">
        <div className="flex-grow flex flex-col justify-center items-start text-left gap-md relative z-10">
          <div className="text-[120px] leading-none glow-red mb-sm relative z-10 -ml-4 -rotate-6">
            ⚠️
          </div>
          <div className="flex flex-col gap-base relative z-10">
            <h1 className="font-headline-xl text-headline-xl text-on-surface">
              Something went wrong
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[280px]">
              The stadium AI hit a technical timeout.
            </p>
          </div>
        </div>

        <div className="bg-surface-container/60 backdrop-blur-xl border border-white/10 rounded-xl p-md mt-xl w-full flex flex-col gap-sm shadow-2xl relative z-10">
          <button
            className="w-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm py-4 rounded-lg uppercase tracking-wider font-bold hover:bg-secondary-fixed-dim transition-colors shadow-[0_0_15px_rgba(195,244,0,0.2)] hover:shadow-[0_0_25px_rgba(195,244,0,0.4)] flex items-center justify-center gap-2"
            onClick={() => window.location.reload()}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            Try Again
          </button>
          <Link
            to="/"
            className="w-full text-center font-label-sm text-label-sm text-on-surface-variant hover:text-secondary-fixed transition-colors py-2"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

export default NotFound;