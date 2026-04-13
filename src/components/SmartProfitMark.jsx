export function SmartProfitIsotype({ className = "h-10 w-10" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sp-gold" x1="8" y1="8" x2="42" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4D97A" />
          <stop offset="1" stopColor="#A06B00" />
        </linearGradient>
        <linearGradient id="sp-green" x1="28" y1="16" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7EE787" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>

      <path
        d="M31.5 6 13 16.2v14.7c0 12.7 7.8 24.4 18.5 27.1 10.7-2.7 18.5-14.4 18.5-27.1V16.2L31.5 6Z"
        fill="#0F172A"
        fillOpacity=".06"
      />
      <path
        d="M17 18.6 31.5 10l13.5 8.6v11.2c0 10.1-5.8 19.3-13.5 21.8C23.8 49.1 17 39.9 17 29.8V18.6Z"
        stroke="url(#sp-gold)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M23 38h6V27h-6v11Zm8-6h6V20h-6v12Zm8-10h6v10h-6V22Z" fill="url(#sp-gold)" />
      <path
        d="M47 35V17l7 7h-4v11h-3Z"
        fill="url(#sp-green)"
      />
      <path
        d="M21 43.5c6.3 4 15.7 4 22 0"
        stroke="url(#sp-green)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SmartProfitWordmark({ collapsed = false }) {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center">
        <div className="rounded-[22px] bg-white/8 p-2.5 ring-1 ring-white/10">
          <SmartProfitIsotype className="h-10 w-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src="/smartprofit_logo.png"
        alt="SmartProfit"
        className="h-14 w-auto object-contain"
      />
    </div>
  );
}
