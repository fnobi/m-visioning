import { type ParsedUrlQuery } from "querystring";
import { useCallback, useMemo } from "react";
import Router from "next/router";
import { useRouter } from "next/router";
import { parseString } from "~/common/lib/parser-helper";
import type PageEntry from "~/common/lib/PageEntry";

const usePageEntryQuery = <T extends Record<string, string>>(
  page: PageEntry<string, T>
) => {
  const { query } = useRouter();

  const parseParams = useCallback((q: ParsedUrlQuery) => {
    const m: Record<string, string> = {};
    Object.entries(q).forEach(([k, v]) => {
      m[k] = parseString(v);
    });
    return m as T;
  }, []);

  const params = useMemo(() => parseParams(query), [parseParams, query]);

  const setParams = useCallback(
    (p: T) => Router.push(page.withQuery(p).href),
    [page]
  );

  return { params, setParams };
};

export default usePageEntryQuery;
