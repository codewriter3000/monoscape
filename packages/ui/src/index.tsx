import type { JSXElement } from "solid-js";
import type { PlatformTarget } from "@monoscape/kernel";

export { FormattingToolbar } from "./FormattingToolbar";
export { TextEditor } from "./TextEditor";
export { RightPanel } from "./RightPanel";

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
    <main class="monoscape-shell">
      <style>{`
        body {
          margin: 0;
          background: #eef2f7;
          color: #172033;
          font-family: Inter, "Segoe UI", system-ui, sans-serif;
        }

        .monoscape-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #eef2f7;
          color: #172033;
        }

        .monoscape-shell__header {
          padding: 24px 32px 18px;
          border-bottom: 1px solid #d9dde6;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(14px);
        }

        .monoscape-shell__header-inner,
        .monoscape-shell__content,
        .monoscape-shell__footer-inner {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .monoscape-shell__eyebrow {
          margin: 0 0 8px;
          color: #52607a;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .monoscape-shell__title {
          margin: 0;
          font-size: clamp(1.75rem, 2vw + 1rem, 2.5rem);
        }

        .monoscape-shell__subtitle {
          margin: 8px 0 0;
          max-width: 56rem;
          color: #52607a;
          font-size: 1rem;
          line-height: 1.5;
        }

        .monoscape-shell__section {
          flex: 1;
          padding: 24px 32px 20px;
        }

        .monoscape-shell__content {
          display: grid;
          align-items: start;
          gap: 24px;
        }

        .monoscape-shell__content.has-secondary {
          grid-template-columns: minmax(0, 1fr) 280px;
        }

        .monoscape-shell__primary {
          min-width: 0;
          display: flex;
          justify-content: center;
          align-items: stretch;
        }

        .monoscape-shell__primary-card {
          width: min(100%, 1080px);
        }

        .monoscape-shell__secondary {
          padding: 20px;
          border: 1px solid #d9dde6;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
        }

        .monoscape-shell__footer {
          padding: 0 32px 32px;
        }

        .monoscape-shell__footer-card {
          padding: 16px 20px;
          border: 1px solid #d9dde6;
          border-radius: 16px;
          background: #ffffff;
          color: #52607a;
          line-height: 1.5;
        }

        @media (max-width: 1080px) {
          .monoscape-shell__content.has-secondary {
            grid-template-columns: minmax(0, 1fr);
          }

          .monoscape-shell__secondary {
            max-width: 720px;
          }
        }

        @media (max-width: 720px) {
          .monoscape-shell__header,
          .monoscape-shell__section,
          .monoscape-shell__footer {
            padding-left: 16px;
            padding-right: 16px;
          }

          .monoscape-shell__header {
            padding-top: 20px;
          }

          .monoscape-shell__section {
            padding-top: 16px;
          }
        }
      `}</style>
      {/* Save for future use */}
      {/* <header class="monoscape-shell__header">
        <div class="monoscape-shell__header-inner">
          <p class="monoscape-shell__eyebrow">
            Platform: {props.platform}
          </p>
          <h1 class="monoscape-shell__title">{props.title}</h1>
          <p class="monoscape-shell__subtitle">{props.subtitle}</p>
        </div>
      </header> */}
      <section class="monoscape-shell__section">
        <div class={`monoscape-shell__content${props.secondary ? " has-secondary" : ""}`}>
          <article class="monoscape-shell__primary">
            <div class="monoscape-shell__primary-card">{props.primary}</div>
          </article>
          {props.secondary ? (
            <aside class="monoscape-shell__secondary">
              {props.secondary}
            </aside>
          ) : null}
        </div>
      </section>
      {props.utilities ? (
        <footer class="monoscape-shell__footer">
          <div class="monoscape-shell__footer-inner">
            <div class="monoscape-shell__footer-card">{props.utilities}</div>
          </div>
        </footer>
      ) : null}
    </main>
  );
}
