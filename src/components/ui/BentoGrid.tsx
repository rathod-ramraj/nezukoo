import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3", className)}>
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  title,
  description,
  icon,
  header,
}: {
  className?: string;
  title: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/bento relative row-span-1 flex flex-col justify-between space-y-3 overflow-hidden rounded-xl border border-border bg-panel p-5 transition duration-300 hover:border-accent",
        className
      )}
    >
      {header}
      <div className="transition duration-300 group-hover/bento:translate-x-1">
        {icon}
        <h3 className="mt-2 font-semibold text-white">{title}</h3>
        <div className="mt-1 text-sm text-muted">{description}</div>
      </div>
    </div>
  );
}
