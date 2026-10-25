import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";
import { processScenarioSchema } from "../../domain/process/processScenario.js";
import { makeProcessCaptureEnvironment } from "./ProcessCaptureEnvironment.js";

it("keeps ambient credentials and runtime hooks out of the launched child", () => {
  const environment = makeProcessCaptureEnvironment({
    scenario: processScenarioSchema.parse({ executable: process.execPath }),
    runId: "capture-owned-run",
    hostEnvironment: {
      PATH: "/usr/bin:/bin",
      LANG: "C",
      LC_CTYPE: "C",
      SESSION_CREDENTIAL: "private-sentinel",
      LC_SESSION_CREDENTIAL: "locale-prefix-sentinel",
      AWS_SESSION_TOKEN: "cloud-sentinel",
      SSH_AUTH_SOCK: "/private/agent.sock",
      NODE_OPTIONS: "--no-warnings",
      LD_PRELOAD: "/private/injected.so",
      REA_PROCESS_RUN_ID: "ambient-run",
      UNUSED: undefined,
    },
  });
  const observed: unknown = JSON.parse(
    execFileSync(
      process.execPath,
      ["-e", "process.stdout.write(JSON.stringify(process.env))"],
      { env: environment, encoding: "utf8" },
    ),
  );
  expect(observed).toMatchObject({
    PATH: "/usr/bin:/bin",
    LANG: "C",
    LC_CTYPE: "C",
    TERM: "xterm-256color",
    REA_PROCESS_RUN_ID: "capture-owned-run",
  });
  for (const name of [
    "SESSION_CREDENTIAL",
    "LC_SESSION_CREDENTIAL",
    "AWS_SESSION_TOKEN",
    "SSH_AUTH_SOCK",
    "NODE_OPTIONS",
    "LD_PRELOAD",
    "UNUSED",
  ])
    expect(observed).not.toHaveProperty(name);
});

it("preserves explicitly selected environment values and empty overrides", () => {
  const environment = makeProcessCaptureEnvironment({
    scenario: processScenarioSchema.parse({
      executable: process.execPath,
      environment: {
        SESSION_CREDENTIAL: "caller-selected",
        PATH: "",
        TERM: "",
        constructor: "ordinary-value",
      },
    }),
    runId: "selected-run",
    hostEnvironment: { PATH: "/ambient/bin", TERM: "ambient-terminal" },
  });
  expect(environment).toEqual({
    SESSION_CREDENTIAL: "caller-selected",
    PATH: "",
    TERM: "",
    constructor: "ordinary-value",
    REA_PROCESS_RUN_ID: "selected-run",
  });
});
