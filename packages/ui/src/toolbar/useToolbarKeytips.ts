import { createSignal, onCleanup, onMount } from "solid-js";

export function useToolbarKeytips(activateKeytip: (key: string) => boolean) {
  const [isKeytipMode, setIsKeytipMode] = createSignal(false);

  onMount(() => {
    const clearKeytips = () => setIsKeytipMode(false);

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsKeytipMode(true);
        return;
      }

      if (event.key === "Escape" && isKeytipMode()) {
        setIsKeytipMode(false);
        return;
      }

      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const normalizedKey = event.key.length === 1 ? event.key.toUpperCase() : "";
      if (!normalizedKey) {
        return;
      }

      if (activateKeytip(normalizedKey)) {
        event.preventDefault();
        setIsKeytipMode(false);
      }
    };

    const handleDocumentKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setIsKeytipMode(false);
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown, true);
    document.addEventListener("keyup", handleDocumentKeyUp, true);
    window.addEventListener("blur", clearKeytips);

    onCleanup(() => {
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
      document.removeEventListener("keyup", handleDocumentKeyUp, true);
      window.removeEventListener("blur", clearKeytips);
    });
  });

  return { isKeytipMode, setIsKeytipMode };
}
