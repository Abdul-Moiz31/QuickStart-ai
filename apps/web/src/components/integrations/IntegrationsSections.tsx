"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

export interface AlertTypeOption {
  type: string;
  name: string;
  description: string;
  category: string;
}

export function AlertTypePicker({
  catalog,
  customRules,
  selected,
  onChange,
}: {
  catalog: AlertTypeOption[];
  customRules: Array<{ eventType: string; name: string; description: string }>;
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const options = useMemo(() => {
    const built = catalog
      .filter((c) => c.type !== "test.ping")
      .map((c) => ({ type: c.type, name: c.name, description: c.description }));
    const custom = customRules.map((r) => ({
      type: r.eventType,
      name: r.name,
      description: r.description,
    }));
    return [...built, ...custom];
  }, [catalog, customRules]);

  function toggle(type: string) {
    if (selected.includes(type)) onChange(selected.filter((t) => t !== type));
    else onChange([...selected, type]);
  }

  if (!options.length) {
    return <p className="text-sm text-mute">No alert types available yet.</p>;
  }

  return (
    <div>
      {options.map((item) => (
        <label
          key={item.type}
          className="flex cursor-pointer gap-3 border-b border-ink/[0.06] py-3 first:pt-0 last:border-0 last:pb-0"
        >
          <input
            type="checkbox"
            checked={selected.includes(item.type)}
            onChange={() => toggle(item.type)}
            className="mt-1 shrink-0"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{item.name}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-mute">{item.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function BuiltInEventsList({ catalog }: { catalog: AlertTypeOption[] }) {
  const items = catalog.filter((c) => c.type !== "test.ping");

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.type}
          className="border-b border-ink/[0.06] py-3 first:pt-0 last:border-0 last:pb-0"
        >
          <p className="text-sm font-medium text-ink">{item.name}</p>
          <p className="mt-0.5 text-xs text-mute">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function HelpDetails({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-ink/[0.08] bg-clay/40 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-ink marker:content-none">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-mute transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 text-sm text-mute">{children}</div>
    </details>
  );
}

export function slugifyAlertName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}
