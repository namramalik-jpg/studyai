import { BadgeCheck, CalendarDays, Clock3, MailCheck, ShieldCheck } from "lucide-react";
import Surface from "./ui/Surface";

const infoIcons = {
  verified: MailCheck,
  account: ShieldCheck,
  login: Clock3,
  member: CalendarDays,
};

export default function ProfileAccountInfo({ items = [] }) {
  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-text">
            Account information
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Security and membership details from your Supabase account.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = infoIcons[item.icon] || ShieldCheck;

          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-muted">
                  {item.label}
                </p>
                <p className="mt-1 break-words text-sm font-black text-text">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
