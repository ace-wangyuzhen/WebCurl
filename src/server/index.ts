import { pathToFileURL } from "node:url";
import { buildApp } from "./app";
import { loadConfig } from "./config";

export async function start(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp({
    maxRequestBodyBytes: config.maxRequestBodyBytes,
  });

  try {
    const address = await app.listen({
      host: config.host,
      port: config.port,
    });
    app.log.info(`Web Curl listening at ${address}`);
  } catch (error) {
    app.log.error(error);
    await app.close();
    throw error;
  }
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1];
  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isMainModule()) {
  try {
    await start();
  } catch (error) {
    console.error("Failed to start Web Curl server", error);
    process.exitCode = 1;
  }
}
