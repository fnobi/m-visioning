import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { parseString } from "~/common/lib/parser-helper";
import type PageEntry from "~/common/lib/PageEntry";

const usePageEntryQuery = <T extends Record<string, string>>(
  page: PageEntry<string, T>
) => {
  const router = useRouter();

  const params = useMemo(() => {
    const m: Record<string, string> = {};
    Object.entries(router.query).forEach(([k, v]) => {
      m[k] = parseString(v);
    });
    return m as T;
  }, [router.query]);

  const setParams = useCallback(
    (p: T) => router.push(page.withQuery(p).href),
    [page, router]
  );

  const mergeParams = useCallback(
    (p: Partial<T>) => setParams({ ...params, ...p }),
    [params, setParams]
  );

  return { params, setParams, mergeParams };
};

export default usePageEntryQuery;
