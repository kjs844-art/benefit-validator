import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGmailDiscoveries } from "@/lib/gmail.functions";
import { useBenefits, useServices } from "@/lib/data";
import {
  createKeyAtlasTools,
  KEYATLAS_WEBMCP_TOOL_NAMES,
  type DiscoveryRecord,
  type KeyAtlasToolApi,
  type WebMcpTool,
} from "./tools";

interface ModelContext {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export type WebMcpStatus = "checking" | "registered" | "unsupported" | "error";

export function useKeyAtlasWebMCP() {
  const services = useServices();
  const benefits = useBenefits();
  const discoveriesFn = useServerFn(getGmailDiscoveries);
  const discoveries = useQuery({
    queryKey: ["gmail-discoveries"],
    queryFn: () => discoveriesFn({}),
  });
  const [status, setStatus] = useState<WebMcpStatus>("checking");

  const api = useMemo<KeyAtlasToolApi>(
    () => ({
      services: services.data ?? [],
      benefits: benefits.data ?? [],
      discoveries: (discoveries.data ?? []) as DiscoveryRecord[],
      navigate: (path) => window.location.assign(path),
    }),
    [benefits.data, discoveries.data, services.data],
  );

  useEffect(() => {
    if (!document.modelContext) {
      setStatus("unsupported");
      return;
    }

    const controller = new AbortController();
    let disposed = false;
    Promise.all(
      createKeyAtlasTools(api).map((tool) =>
        document.modelContext?.registerTool(tool, { signal: controller.signal }),
      ),
    )
      .then(() => {
        if (!disposed) setStatus("registered");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [api]);

  return {
    status,
    toolCount: KEYATLAS_WEBMCP_TOOL_NAMES.length,
    loading: services.isLoading || benefits.isLoading || discoveries.isLoading,
  };
}
