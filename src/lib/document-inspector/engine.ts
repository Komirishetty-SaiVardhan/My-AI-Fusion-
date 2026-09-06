import { InspectedDocumentData } from "./types";

export const SAMPLE_INSPECTED_DOCUMENT: InspectedDocumentData = {
  id: "doc-spec-01",
  title: "Cloud Infrastructure Architecture & SLA Specification",
  docType: "technical-spec",
  pageCount: 4,
  authorOrOrg: "Cloud Engineering Council",
  executiveSummary: "Defines the 99.99% multi-region uptime SLA, fault-tolerant failover protocols, and automated disaster recovery thresholds across global edge nodes.",
  sections: [
    {
      id: "sec-1",
      pageNumber: 1,
      title: "Section 1: High Availability & Multi-Region Topology",
      summary: "Outlines active-active cross-region replication strategy with sub-50ms RPO.",
      content: "The primary database clusters shall synchronize continuously across AWS us-east-1 and eu-central-1 using bi-directional logical replication. Edge DNS routing will perform health checks every 5 seconds and reroute traffic within 15 seconds upon node degradation.",
      keyTakeaways: [
        "Active-active cross-region database replication",
        "5-second DNS health checks with 15-second failover threshold",
        "RPO < 50ms, RTO < 60 seconds",
      ],
      annotations: [
        {
          id: "ann-1",
          quote: "Edge DNS routing will perform health checks every 5 seconds",
          comment: "Crucial for preventing cascading timeout failures during regional network partitions.",
          type: "insight",
        },
      ],
    },
    {
      id: "sec-2",
      pageNumber: 2,
      title: "Section 2: SLA Uptime Commitments & Penalties",
      summary: "Specifies 99.99% monthly availability calculation and service credit tiers.",
      content: "Monthly uptime shall not fall below 99.99% (maximum allowed downtime: 4.38 minutes per month). If availability dips between 99.90% and 99.98%, a 10% credit applies. For < 99.00%, a 50% credit applies.",
      keyTakeaways: [
        "99.99% availability = max 4.38 min downtime/month",
        "Tiered financial service credits (10% to 50%) for SLA breaches",
      ],
      annotations: [
        {
          id: "ann-2",
          quote: "maximum allowed downtime: 4.38 minutes per month",
          comment: "High stringency SLA: Requires zero-downtime blue/green deployments.",
          type: "important",
        },
      ],
    },
  ],
  extractedTables: [
    {
      id: "tbl-1",
      title: "SLA Tiers & Refund Credits",
      headers: ["Monthly Availability Tier", "Max Allowed Downtime", "Customer Service Credit"],
      rows: [
        ["99.99% - 100%", "4.38 minutes", "0% (SLA Met)"],
        ["99.90% - 99.98%", "43.8 minutes", "10% Credit"],
        ["99.00% - 99.89%", "7.3 hours", "25% Credit"],
        ["< 99.00%", "> 7.3 hours", "50% Credit"],
      ],
    },
  ],
};

export function parseDocumentInspectMarkdown(rawText: string): InspectedDocumentData {
  try {
    const trimmed = rawText.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return {
        ...SAMPLE_INSPECTED_DOCUMENT,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }

  return SAMPLE_INSPECTED_DOCUMENT;
}
