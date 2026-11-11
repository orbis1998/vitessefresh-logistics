type Props = {
  className?: string;
  /** Use only the yellow mark (favicon / compact UI). */
  symbolOnly?: boolean;
  /** Full lockup as a single image (icon + Vita Express). */
  lockup?: boolean;
};

export const VitaWordmark = ({
  className = "",
  symbolOnly = false,
  lockup = false,
}: Props) => {
  if (symbolOnly) {
    return (
      <img
        src="/vita-symbol.png"
        alt="Vita Express"
        className={`h-8 w-auto shrink-0 object-contain ${className}`}
      />
    );
  }

  return (
    <img
      src="/vita-logo.png"
      alt="Vita Express"
      className={`w-auto shrink-0 object-contain ${className || "h-10"}`}
    />
  );
};
