type StarIconProps = {
  size?: number;
  className?: string;
};

/** The exact attached star artwork, served from /star.svg. */
export default function StarIcon({ size = 18, className = '' }: StarIconProps) {
  return (
    <img
      src="/star.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      className={`inline-block shrink-0 align-[-0.16em] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
