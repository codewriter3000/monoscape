import { Show } from "solid-js";
import type { RecentDesktopDocument } from "./documentFileIO";
import "./welcome/welcomeScreen.css";
import { WelcomeTemplateGrid } from "./welcome/WelcomeTemplateGrid";
import { WelcomeRecentSection } from "./welcome/WelcomeRecentSection";

export interface WelcomeScreenProps {
  activeDocumentTitle?: string;
  hasActiveDocument: boolean;
  loadingRecentDocuments?: boolean;
  recentDocuments: RecentDesktopDocument[];
  onCreateBlank: () => void;
  onCreateFromTemplate: (templateId: string) => void;
  onOpenFile: () => void;
  onOpenRecent: (path: string) => void;
  onResumeCurrentDocument?: () => void;
}

export function WelcomeScreen(props: WelcomeScreenProps) {
  return (
    <section class="desktop-welcome" aria-label="Welcome screen">

      <div class="desktop-welcome__hero">
        <div class="desktop-welcome__panel">
          {/* <p class="desktop-welcome__eyebrow">Welcome, Alex</p> */}
          <h1 class="desktop-welcome__title">Your new word processing experience starts now.</h1>
          <p class="desktop-welcome__copy">
            Pick the starting point best suited for you.
          </p>
          <div class="desktop-welcome__action-row">
            <button
              type="button"
              class="desktop-welcome__button desktop-welcome__button--primary"
              aria-label="Create a blank document"
              onClick={props.onCreateBlank}
            >
              <span aria-hidden="true">+</span>
              Blank document
            </button>
            <button
              type="button"
              class="desktop-welcome__button"
              aria-label="Open a document from disk"
              onClick={props.onOpenFile}
            >
              <span aria-hidden="true">↗</span>
              Open document
            </button>
          </div>
        </div>

        {/* <div class="desktop-welcome__panel desktop-welcome__resume">
          <Show
            when={props.hasActiveDocument}
            fallback={
              <>
                <span class="desktop-welcome__resume-chip">Ready to draft</span>
                <h2 class="desktop-welcome__resume-title">No document is active yet.</h2>
                <p class="desktop-welcome__resume-copy">
                  Start with a blank page, choose a preset below, or open an existing
                  Monoscape file.
                </p>
              </>
            }
          >
            <span class="desktop-welcome__resume-chip">Current session available</span>
            <h2 class="desktop-welcome__resume-title">{props.activeDocumentTitle}</h2>
            <p class="desktop-welcome__resume-copy">
              Your current document stays loaded while you browse templates and recent files.
            </p>
            <div class="desktop-welcome__resume-actions">
              <button
                type="button"
                class="desktop-welcome__button desktop-welcome__button--primary"
                aria-label="Resume the current document"
                onClick={() => props.onResumeCurrentDocument?.()}
              >
                Return to editor
              </button>
            </div>
          </Show>
        </div> */}
      </div>

      {/* <WelcomeTemplateGrid onCreateFromTemplate={props.onCreateFromTemplate} /> */}

      <WelcomeRecentSection
        loadingRecentDocuments={props.loadingRecentDocuments}
        recentDocuments={props.recentDocuments}
        onOpenRecent={props.onOpenRecent}
      />
    </section>
  );
}