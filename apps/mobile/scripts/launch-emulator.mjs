import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const config = {
  avd: process.env.MONOSCAPE_AVD ?? "Pixel_9a",
  memory: process.env.MONOSCAPE_EMULATOR_MEMORY_MB,
  cores: process.env.MONOSCAPE_EMULATOR_CORES,
  gpu: process.env.MONOSCAPE_EMULATOR_GPU,
  passthrough: []
};

const separatorIndex = args.indexOf("--");
const parsedArgs = separatorIndex >= 0 ? args.slice(0, separatorIndex) : args;
config.passthrough = separatorIndex >= 0 ? args.slice(separatorIndex + 1) : [];

for (let i = 0; i < parsedArgs.length; i += 1) {
  const arg = parsedArgs[i];
  const value = parsedArgs[i + 1];

  switch (arg) {
    case "--avd":
      if (value) {
        config.avd = value;
        i += 1;
      }
      break;
    case "--memory":
      if (value) {
        config.memory = value;
        i += 1;
      }
      break;
    case "--cores":
      if (value) {
        config.cores = value;
        i += 1;
      }
      break;
    case "--gpu":
      if (value) {
        config.gpu = value;
        i += 1;
      }
      break;
    case "--help":
    case "-h":
      console.log(
        [
          "Monoscape emulator launcher",
          "Usage: npm run android:emulator -- [--avd Pixel_9a] [--memory 8192] [--cores 8] [--gpu host]",
          "Env overrides: MONOSCAPE_AVD, MONOSCAPE_EMULATOR_MEMORY_MB, MONOSCAPE_EMULATOR_CORES, MONOSCAPE_EMULATOR_GPU",
          "Pass-through args: npm run android:emulator -- --memory 8192 -- -no-snapshot"
        ].join("\n")
      );
      process.exit(0);
    default:
      break;
  }
}

const localAppData = process.env.LOCALAPPDATA;
const emulatorPath =
  process.env.MONOSCAPE_EMULATOR_PATH ??
  (localAppData ? path.join(localAppData, "Android", "Sdk", "emulator", "emulator.exe") : "");

if (!emulatorPath || !existsSync(emulatorPath)) {
  console.error(
    "Android emulator executable not found. Set MONOSCAPE_EMULATOR_PATH or verify your Android SDK install."
  );
  process.exit(1);
}

const emulatorArgs = ["-avd", config.avd];
if (config.memory) {
  emulatorArgs.push("-memory", config.memory);
}
if (config.cores) {
  emulatorArgs.push("-cores", config.cores);
}
if (config.gpu) {
  emulatorArgs.push("-gpu", config.gpu);
}

emulatorArgs.push(...config.passthrough);

console.log(
  `[Monoscape] Launching emulator: ${emulatorPath} ${emulatorArgs.map((entry) => `"${entry}"`).join(" ")}`
);

const child = spawn(emulatorPath, emulatorArgs, { stdio: "inherit" });
child.on("exit", (code) => {
  process.exit(code ?? 0);
});
