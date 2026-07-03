const surfaceVariants = {
  panel:
    "study-glass",
  subtle:
    "study-card-muted",
  flat:
    "study-card",
};

const surfacePadding = {
  none: "",
  compact: "p-4 sm:p-5",
  default: "p-5 sm:p-6",
};

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function getSurfaceClass({
  variant = "panel",
  padding = "default",
  className = "",
} = {}) {
  return cx(surfaceVariants[variant], surfacePadding[padding], className);
}

export default function Surface({
  as: Component = "section",
  variant = "panel",
  padding = "default",
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={getSurfaceClass({ variant, padding, className })}
      {...props}
    >
      {children}
    </Component>
  );
}
