import { useCallback, useMemo } from "react";
import Router, { useRouter } from "next/router";
import { parseString } from "~/common/lib/parser-helper";

export const parseBooleanQuery = (src: unknown) => src === "true";

const useTypedQuery = <T>(key: string, parse: (v: unknown) => T) => {
  const { query, route } = useRouter();

  const pushQuery = useCallback(
    (v: string) => {
      const u = new URLSearchParams(window.location.search);
      if (v) {
        u.set(key, v);
      } else {
        u.delete(key);
      }
      Router.push(`${route}?${u.toString()}`);
    },
    [key, route]
  );

  const rawValue = useMemo(() => parseString(query[key]), [key, query]);

  const queryValue = useMemo((): T => parse(rawValue), [parse, rawValue]);
  const setQueryValue = useCallback(
    (v: T) => pushQuery(parseString(v)),
    [pushQuery]
  );

  return { queryValue, setQueryValue };
};

export default useTypedQuery;
