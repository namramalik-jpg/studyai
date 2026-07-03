import Surface from "./Surface";

export default function Card({ children, className = "", ...props }) {
  return (
    <Surface className={className} {...props}>
      {children}
    </Surface>
  );
}
