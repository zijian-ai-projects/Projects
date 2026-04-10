import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <section
      className={[
        "surface p-6",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <header className={["mb-5 space-y-1", className ?? ""].filter(Boolean).join(" ")} {...props}>
      {children}
    </header>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: CardProps) {
  return (
    <h2
      className={["text-lg font-semibold tracking-tight text-app-strong", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: CardProps) {
  return (
    <p
      className={["text-sm leading-6 text-app-muted", className ?? ""].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div className={["space-y-4", className ?? ""].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
