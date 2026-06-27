export const WaterDropIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M16 3C16 3 6 14.5 6 21.5C6 26.09 10.48 30 16 30C21.52 30 26 26.09 26 21.5C26 14.5 16 3 16 3Z"
      fill="url(#waterDropGrad)"
    />
    <ellipse cx="12" cy="19" rx="3" ry="5" fill="#fff" opacity="0.35" />
    <defs>
      <linearGradient id="waterDropGrad" x1="16" y1="3" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#69b1ff" />
        <stop offset="0.45" stopColor="#4096ff" />
        <stop offset="1" stopColor="#1677ff" />
      </linearGradient>
    </defs>
  </svg>
);
