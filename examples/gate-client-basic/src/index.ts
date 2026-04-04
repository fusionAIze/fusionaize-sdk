// Basic example using @fusionaize/gate-client

import { GateClient } from "@fusionaize/gate-client";
import { loadConfig } from "@fusionaize/sdk-config";

async function main() {
  console.log("Loading configuration...");
  const config = await loadConfig();
  console.log("Config:", { endpoint: config.gateEndpoint, profile: config.profile });

  const client = new GateClient(config);

  console.log("Creating a run...");
  const run = await client.createRun({
    model: "claude-3-haiku",
    messages: [{ role: "user", content: "Say hello in JSON" }],
  });
  console.log("Run created:", { id: run.id, model: run.model });

  console.log("Fetching run details...");
  const details = await client.getRun(run.id);
  console.log("Run details:", { choices: details.choices });

  console.log("Listing recent runs...");
  const list = await client.listRuns({ limit: 5 });
  console.log(`Found ${list.items.length} runs`);
}

main().catch((error) => {
  console.error("Example failed:", error);
  process.exit(1);
});
