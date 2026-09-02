import {
  Bell,
  Code2,
  FileText,
  Globe,
  KeyRound,
  MessageSquare,
  Plug,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: FileText, label: "Trained on your FAQs" },
  { icon: Code2, label: "One-line embed" },
  { icon: Bell, label: "Real-time alerts" },
  { icon: Plug, label: "MCP connect" },
  { icon: ShieldCheck, label: "Secure by design" },
  { icon: MessageSquare, label: "Every conversation logged" },
  { icon: KeyRound, label: "Bring your own key" },
  { icon: Globe, label: "Works on any site" },
];

function StripItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-6">
      <Icon className="h-4 w-4 shrink-0 text-ink/60" strokeWidth={1.75} aria-hidden />
      <span className="whitespace-nowrap text-sm font-semibold text-ink">{label}</span>
      <span className="ml-6 h-1 w-1 shrink-0 rounded-full bg-ink/20" aria-hidden />
    </div>
  );
}

export function LandingFeatureStrip() {
  return (
    <section className="border-t border-ink/[0.08] bg-white py-8 sm:py-10">
      <p className="text-center qs-eyebrow">
        Everything you need, built in
      </p>

      <div
        className="relative mt-6 overflow-hidden"
        aria-hidden
        style={{
          maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="qs-marquee-track flex w-max items-center">
          {[...ITEMS, ...ITEMS].map((item, i) => (
            <StripItem key={i} icon={item.icon} label={item.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
