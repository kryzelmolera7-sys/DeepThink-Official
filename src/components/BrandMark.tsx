interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className = 'w-6 h-6' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="2.5"
        width="23"
        height="23"
        rx="6"
        className="stroke-blue-700 dark:stroke-blue-400"
        strokeWidth="1.75"
      />
      <path
        d="M9 14C9 11.2386 11.2386 9 14 9C16.7614 9 19 11.2386 19 14C19 16.7614 16.7614 19 14 19"
        className="stroke-blue-700 dark:stroke-blue-400"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle
        cx="14"
        cy="14"
        r="2.25"
        className="fill-blue-700 dark:fill-blue-400"
      />
    </svg>
  );
}
