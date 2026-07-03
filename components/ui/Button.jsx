import { cx } from "./Surface";

const buttonVariants = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-glow",
  secondary:
    "border border-border bg-card text-text shadow-sm hover:bg-surface",
  ghost:
    "text-muted hover:bg-surface hover:text-primary",
  danger:
    "bg-danger/10 text-danger hover:bg-danger hover:text-white",
};

const buttonSizes = {
  icon: "h-11 w-11 rounded-xl p-0",
  sm: "min-h-10 rounded-xl px-4 py-2 text-sm",
  md: "min-h-11 rounded-xl px-5 py-2.5 text-sm",
  lg: "min-h-12 rounded-xl px-7 py-3 text-base",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const buttonProps =
    Component === "button" && !props.type ? { type: "button", ...props } : props;

  return (
    <Component
      className={cx(
        "inline-flex min-w-0 max-w-full items-center justify-center gap-2 text-center font-bold leading-tight transition duration-200 [overflow-wrap:anywhere] [&>svg]:shrink-0",
        "hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
        "study-focus",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...buttonProps}
    >
      {children}
    </Component>
  );
}
