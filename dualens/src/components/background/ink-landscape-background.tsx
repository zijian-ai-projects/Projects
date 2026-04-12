type InkLandscapeBackgroundVariant = "home" | "workspace";

export function InkLandscapeBackground({
  variant = "home"
}: {
  variant?: InkLandscapeBackgroundVariant;
}) {
  const isWorkspace = variant === "workspace";

  return (
    <div
      aria-hidden="true"
      data-testid="ink-landscape-background"
      data-variant={variant}
      className={[
        "ink-landscape pointer-events-none fixed inset-0 z-0 overflow-hidden",
        isWorkspace ? "ink-landscape--workspace" : "ink-landscape--home"
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        className="ink-landscape__taiji"
        fill="none"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="60" cy="60" r="56" className="stroke-current" strokeWidth="1.25" />
        <path className="fill-current" d="M60 4a56 56 0 0 1 0 112a28 28 0 0 0 0-56a28 28 0 0 1 0-56Z" />
        <circle cx="60" cy="32" r="9" className="fill-app" />
        <circle cx="60" cy="88" r="9" className="fill-current" />
      </svg>

      <svg
        aria-hidden="true"
        className="ink-landscape__mist ink-landscape__mist--one"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 900 220"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M42 126c74-44 126-42 196-17 88 32 144 20 223-18 76-37 151-33 241 13 57 29 104 31 160 4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="18"
        />
        <path
          d="M6 166c91-25 154-18 244-1 103 19 170 8 251-22 80-29 156-28 249 1 64 20 111 20 144 8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>

      <svg
        aria-hidden="true"
        className="ink-landscape__mountains ink-landscape__mountains--far"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 420"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 292C86 254 146 259 226 217C309 174 360 109 442 151C520 191 553 251 642 205C746 151 789 75 883 128C969 176 990 246 1074 224C1125 211 1165 184 1200 176V420H0V292Z"
          className="fill-current"
        />
      </svg>

      <svg
        aria-hidden="true"
        className="ink-landscape__mountains ink-landscape__mountains--near"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 360"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 252C83 221 151 220 231 237C327 258 358 198 427 207C506 218 544 282 626 263C719 241 761 172 843 188C936 206 966 279 1061 269C1119 263 1167 237 1200 226V360H0V252Z"
          className="fill-current"
        />
        <path
          d="M28 280C148 249 251 269 367 251C483 234 547 278 663 259C781 240 834 208 956 231C1057 250 1112 260 1186 241"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="10"
        />
      </svg>
    </div>
  );
}
