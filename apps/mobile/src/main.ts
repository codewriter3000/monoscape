import { render } from "solid-js/web";
import { MobileApp, mobileBootstrapPlan } from "./App";
import { createMobileLogger, initializeMobileLogging } from "./logging";

initializeMobileLogging();
const logger = createMobileLogger("Bootstrap");

const root = document.getElementById("app");

if (!(root instanceof HTMLElement)) {
  logger.error("Mobile app root element was not found.");
  throw new Error("Mobile app root element was not found.");
}

render(MobileApp, root);
logger.info("Mobile renderer attached.", { extensionQueue: mobileBootstrapPlan.extensionQueue });

export { MobileApp, mobileBootstrapPlan };
