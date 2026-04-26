"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseString } from "~/common/lib/parser-helper";

export const parseBooleanQuery = (src: unknown) => src === "true";

const useTypedQuery = <T>(key: string, parse: (v: unknown) => T) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pushQuery = useCallback(
    (v: string) => {
      const u = new URLSearchParams(searchParams?.toString() || "");
      if (v) {
        u.set(key, v);
      } else {
        u.delete(key);
      }
      const qs = u.toString();
      const path = pathname || "/";
      router.push(qs ? `${path}?${qs}` : path);
    },
    [key, pathname, router, searchParams]
  );

  const rawValue = useMemo(
    () => parseString(searchParams?.get(key)),
    [key, searchParams]
  );

  const queryValue = useMemo((): T => parse(rawValue), [parse, rawValue]);
  const setQueryValue = useCallback(
    (v: T) => pushQuery(parseString(v)),
    [pushQuery]
  );

  return { queryValue, setQueryValue };
};

export default useTypedQuery;
