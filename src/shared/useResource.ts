import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export function useResource<T>(path: string, identity?: string) {
  const key = `${path}\0${identity || ""}`;
  const [source, setSource] = useState(key);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setSource(key);
    setLoading(true);
    setData(null);
    setError("");
    api<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, version, key]);
  return {
    data: source === key ? data : null,
    error: source === key ? error : "",
    loading: source !== key || loading,
    reload,
    setData,
  };
}
