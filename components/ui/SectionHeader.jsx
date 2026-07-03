export default function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  titleAs: TitleTag = "h2",
  className = "",
}) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
          {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
          {eyebrow}
        </p>
      )}
      {title && (
        <TitleTag className="mt-2 break-words text-xl font-bold tracking-normal text-text sm:text-2xl">
          {title}
        </TitleTag>
      )}
      {description && (
        <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
