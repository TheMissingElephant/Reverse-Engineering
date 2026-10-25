import type { ProcessScenario } from "../../domain/process/processScenario.js";

interface ProcessCaptureEnvironmentOptions {
  readonly scenario: ProcessScenario;
  readonly runId: string;
  readonly hostEnvironment: Readonly<Record<string, string | undefined>>;
}

const HOST_ENVIRONMENT_NAMES: ReadonlySet<string> = new Set([
  "PATH",
  "HOME",
  "USER",
  "LOGNAME",
  "SHELL",
  "LANG",
  "LC_ALL",
  "LC_ADDRESS",
  "LC_COLLATE",
  "LC_CTYPE",
  "LC_IDENTIFICATION",
  "LC_MEASUREMENT",
  "LC_MESSAGES",
  "LC_MONETARY",
  "LC_NAME",
  "LC_NUMERIC",
  "LC_PAPER",
  "LC_TELEPHONE",
  "LC_TIME",
  "TERM",
  "TZ",
  "TMPDIR",
  "TMP",
  "TEMP",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "PATHEXT",
]);

/** Inherit only basic host settings; other values require explicit scenario overrides. */
export const makeProcessCaptureEnvironment = (
  options: ProcessCaptureEnvironmentOptions,
): Record<string, string> => ({
  ...Object.fromEntries(
    Object.entries(options.hostEnvironment).filter(
      (entry): entry is [string, string] =>
        entry[1] !== undefined && HOST_ENVIRONMENT_NAMES.has(entry[0]),
    ),
  ),
  ...options.scenario.environment,
  TERM:
    options.scenario.environment.TERM ??
    options.hostEnvironment.TERM ??
    "xterm-256color",
  REA_PROCESS_RUN_ID: options.runId,
});
