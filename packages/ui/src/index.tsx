import type { JSXElement } from "solid-js";
import type { PlatformTarget } from "@monoscape/kernel";

export { FormattingToolbar } from "./FormattingToolbar";
export { TextEditor } from "./TextEditor";

export interface MonoscapeShellProps {
  platform: PlatformTarget;
  title: string;
  subtitle: string;
  primary: JSXElement;
  secondary?: JSXElement;
  utilities?: JSXElement;
}

export function MonoscapeShell(props: MonoscapeShellProps) {
  return (
    <main>
      <header>
        <p>Platform: {props.platform}</p>
        <h1>{props.title}</h1>
        <p>{props.subtitle}</p>
      </header>
      <section>
        <article>{props.primary}</article>
        {props.secondary ? <aside>{props.secondary}</aside> : null}
      </section>
      {props.utilities ? <footer>{props.utilities}</footer> : null}
    </main>
  );
}
