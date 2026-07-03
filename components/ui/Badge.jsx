import { cx } from "./Surface";

const variants = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-surface text-muted",
};

export default function Badge({ children, variant = "primary", className = "" }) {
  return (
    <span className={cx("inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold", variants[variant], className)}>
      {children}
    </span>
  );
}
