import React, { useEffect, useState } from "react";

// Minimal observability-only example for a Foxglove custom panel.
// It reads Dant3 public data only. There is deliberately no Robot command,
// navigation, trajectory, motor, GPIO, PLC or teleoperation output path.

const MCP_URL = "https://dant3.net/mcp";

type Overview = {
  name?: string;
  status?: string;
  machine_access?: string;
  machine_fast_join_endpoint?: string;
};

export function Dant3StatusPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(MCP_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "dant3_platform_overview", arguments: {} },
      }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((body) => {
        const raw = body?.result?.content?.find?.((x: any) => x?.type === "text")?.text;
        try {
          setOverview(raw ? JSON.parse(raw) : body?.result ?? null);
        } catch {
          setOverview({ status: "Dant3 public MCP reachable" });
        }
      })
      .catch((e) => setError(String(e?.message || e)));
    return () => controller.abort();
  }, []);

  return (
    <div style={{ padding: 12, fontFamily: "sans-serif" }}>
      <strong>Dant3 Robot identity / network status</strong>
      <div>Mode: observability only</div>
      {error ? <div>Unavailable: {error}</div> : <pre>{JSON.stringify(overview, null, 2)}</pre>}
    </div>
  );
}
