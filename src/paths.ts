const FALLBACK_ORIGIN = "http://localhost";

const resolveBase = () => {
  const rawBase = import.meta.env.BASE_URL ?? "/";
  if (/^https?:/i.test(rawBase)) {
    return rawBase;
  }

  try {
    const origin = typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : FALLBACK_ORIGIN;
    return new URL(rawBase, origin).toString();
  } catch (error) {
    return rawBase;
  }
};

const baseUrl = resolveBase();

export const withBase = (p: string) => {
  const path = p ?? "";
  if (!path) {
    return baseUrl;
  }

  return new URL(path, baseUrl).toString();
};
