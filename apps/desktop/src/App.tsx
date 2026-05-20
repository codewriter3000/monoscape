import { Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { defaultWorkflowTemplates } from "@monoscape/document-core";
import { citationsExtension } from "@monoscape/extension-citations";
import { reviewExtension } from "@monoscape/extension-review";
import { createBootstrapPlan } from "@monoscape/kernel";
import { MonoscapeShell, RightPanel, TextEditor, type ListState, type BulletStyle, type NumberStyle } from "@monoscape/ui";
import { DesktopTopbar } from "./DesktopTopbar";
import { desktopDocumentFileIO, type RecentDesktopDocument } from "./documentFileIO";
import { desktopFontCapabilities } from "./fontSources";
import { WelcomeScreen } from "./WelcomeScreen";
import "./desktopRuntime.css";
import { deriveDocumentTitle, isUntitledTitle, readErrorMessage } from "./desktopAppHelpers";
import {
  FALLBACK_RECENT_STATUS,
  createBlankDocumentSession,
  createTemplateDocumentSession,
  type DesktopDocumentSession,
  type DesktopStatusMessage,
  type StatusTone
} from "./desktopAppSessions";
import { useDesktopDocumentActions } from "./useDesktopDocumentActions";

export const desktopBootstrapPlan = createBootstrapPlan(
  {
    id: "desktop-shell",
    name: "Monoscape Desktop",
    platform: "desktop",
    accessibilityBaseline: "WCAG 2.2 AA",
    audience: "Students moving between focused drafting, research, and review",
    extensionSlots: ["document.command-bar", "document.sidebar", "document.review-pane"],
    defaultExtensionIds: [citationsExtension.manifest.id, reviewExtension.manifest.id]
  },
  [citationsExtension.manifest, reviewExtension.manifest]
);

export function DesktopApp() {
  const [viewMode, setViewMode] = createSignal<"welcome" | "editor">("welcome");
  const [currentSession, setCurrentSession] = createSignal<DesktopDocumentSession | null>(null);
  const [recentDocuments, setRecentDocuments] = createSignal<RecentDesktopDocument[]>([]);
  const [isLoadingRecentDocuments, setIsLoadingRecentDocuments] = createSignal(false);
  const [isWorking, setIsWorking] = createSignal(false);
  const [statusMessage, setStatusMessage] = createSignal<DesktopStatusMessage>(FALLBACK_RECENT_STATUS);

  const hasDesktopFileIO = () => desktopDocumentFileIO.isAvailable();
  const activeSession = createMemo(() => currentSession());
  const hasEditorSession = createMemo(() => !!activeSession());
  const isEditorMode = createMemo(() => viewMode() === "editor" && hasEditorSession());
  const isDocumentDirty = createMemo(() => {
    const session = activeSession();
    return !!session && session.editorHtml !== session.savedHtml;
  });

  // Bridge: list actions registered by TextEditor, consumed by RightPanel.
  // Hoisted to component scope (not inside Show) so the signal has a stable reactive owner.
  const [listActions, setListActions] = createSignal<{
    listState: () => ListState;
    toggleUnorderedList: () => void;
    toggleOrderedList: () => void;
    applyBulletStyle: (style: BulletStyle) => void;
    applyNumberStyle: (style: NumberStyle) => void;
    applyStartNumber: (n: number) => void;
    applyCustomIconBullet: (svg: string) => void;
    removeCustomIconBullet: () => void;
  } | undefined>(undefined);

  const setStatus = (text: string, tone: StatusTone = "neutral") => {
    setStatusMessage({ text, tone });
  };

  const refreshRecentDocuments = async () => {
    if (!hasDesktopFileIO()) {
      setRecentDocuments([]);
      return;
    }

    setIsLoadingRecentDocuments(true);
    try {
      setRecentDocuments(await desktopDocumentFileIO.listRecentDocuments());
    } catch (error) {
      setStatus(readErrorMessage(error, "Unable to load recent documents."), "danger");
    } finally {
      setIsLoadingRecentDocuments(false);
    }
  };

  onMount(() => {
    void refreshRecentDocuments();
  });

  const openEditorSession = (session: DesktopDocumentSession, nextStatus?: DesktopStatusMessage) => {
    setCurrentSession(session);
    setViewMode("editor");
    if (nextStatus) {
      setStatus(nextStatus.text, nextStatus.tone);
    }
  };

  const updateCurrentSessionFromEditor = (editorHtml: string) => {
    setCurrentSession((session) => {
      if (!session) {
        return session;
      }

      const nextTitle =
        !session.path && isUntitledTitle(session.title)
          ? deriveDocumentTitle(editorHtml, session.title)
          : session.title;

      return { ...session, title: nextTitle, editorHtml, updatedAt: Date.now() };
    });
  };

  const enterWelcomeMode = () => {
    setViewMode("welcome");
    setStatus(FALLBACK_RECENT_STATUS.text, FALLBACK_RECENT_STATUS.tone);
  };

  const createBlankDocument = () => {
    openEditorSession(createBlankDocumentSession(), { tone: "success", text: "Blank document ready." });
  };

  const createDocumentFromTemplate = (templateId: string) => {
    const template = defaultWorkflowTemplates.find((entry) => entry.id === templateId);
    openEditorSession(createTemplateDocumentSession(templateId), {
      tone: "success",
      text: template ? `${template.label} preset loaded.` : "Preset loaded."
    });
  };

  const { openDocument, openRecentDocument, saveCurrentSession, exportCurrentSessionToPdf, printCurrentSession } =
    useDesktopDocumentActions({
      hasDesktopFileIO,
      setIsWorking,
      setStatus,
      openEditorSession,
      refreshRecentDocuments,
      activeSession
    });

  onMount(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "n":
          event.preventDefault();
          enterWelcomeMode();
          return;
        case "o":
          event.preventDefault();
          void openDocument();
          return;
        case "s":
          event.preventDefault();
          void saveCurrentSession("save");
          return;
        case "p":
          event.preventDefault();
          if (isEditorMode()) {
            printCurrentSession();
          }
          return;
        default:
          return;
      }
    };

    document.addEventListener("keydown", handleShortcut);

    onCleanup(() => {
      document.removeEventListener("keydown", handleShortcut);
    });
  });

  return (
    <div class="desktop-runtime">
      <DesktopTopbar
        extensionCount={desktopBootstrapPlan.extensionQueue.length}
        viewMode={viewMode()}
        documentTitle={activeSession()?.title}
        documentMode={activeSession()?.workspaceMode}
        documentPath={activeSession()?.path}
        isBusy={isWorking()}
        isDocumentDirty={isDocumentDirty()}
        canSave={hasEditorSession()}
        canExport={isEditorMode()}
        canPrint={isEditorMode()}
        onNew={enterWelcomeMode}
        onOpen={() => void openDocument()}
        onSave={() => void saveCurrentSession("save")}
        onSaveAs={() => void saveCurrentSession("save-as")}
        onSaveCopy={() => void saveCurrentSession("save-copy")}
        onExportPdf={() => void exportCurrentSessionToPdf()}
        onPrint={printCurrentSession}
      />
      <div class="desktop-runtime__body">
        <div class="desktop-runtime__surface">
          <Show
            when={isEditorMode() && activeSession()}
            fallback={
              <WelcomeScreen
                activeDocumentTitle={activeSession()?.title}
                hasActiveDocument={hasEditorSession()}
                loadingRecentDocuments={isLoadingRecentDocuments()}
                recentDocuments={recentDocuments()}
                onCreateBlank={createBlankDocument}
                onCreateFromTemplate={createDocumentFromTemplate}
                onOpenFile={() => void openDocument()}
                onOpenRecent={(path) => void openRecentDocument(path)}
                onResumeCurrentDocument={() => setViewMode("editor")}
              />
            }
          >
            {(session) => {
              // Bridge: TextEditor registers its insert-icon function here;
              // RightPanel calls it via onInsertSvg.
              let insertIconRef: ((svg: string, name: string) => void) | undefined;
              // Bridge: image-insertion helpers registered by TextEditor.
              let insertImageRef: { insertFromFile: () => void; insertFromUrl: (url: string) => void } | undefined;

              return (
              <MonoscapeShell
                platform="desktop"
                title="Monoscape Desktop"
                subtitle="Desktop editor shell"
                primary={
                  <TextEditor
                    documentSessionKey={session().id}
                    initialDocumentHtml={session().editorHtml}
                    onDocumentChange={updateCurrentSessionFromEditor}
                    fontCapabilities={desktopFontCapabilities}
                    onRegisterInsertIcon={(fn) => { insertIconRef = fn; }}
                    onRegisterListActions={(actions) => setListActions(actions)}
                    onRegisterInsertImage={(actions) => { insertImageRef = actions; }}
                  />
                }
                secondary={
                  <RightPanel
                    onInsertSvg={(svg, name) => insertIconRef?.(svg, name)}
                    onInsertImageFromFile={() => insertImageRef?.insertFromFile()}
                    onInsertImageFromUrl={(url) => insertImageRef?.insertFromUrl(url)}
                    listState={listActions()?.listState()}
                    onToggleUnorderedList={() => listActions()?.toggleUnorderedList()}
                    onToggleOrderedList={() => listActions()?.toggleOrderedList()}
                    onSetListBulletStyle={(s) => listActions()?.applyBulletStyle(s)}
                    onSetListNumberStyle={(s) => listActions()?.applyNumberStyle(s)}
                    onSetListStartNumber={(n) => listActions()?.applyStartNumber(n)}
                    onSetCustomIconBullet={(svg) => listActions()?.applyCustomIconBullet(svg)}
                    onRemoveCustomIconBullet={() => listActions()?.removeCustomIconBullet()}
                  />
                }
                utilities={
                  <div class="desktop-runtime__utilities">
                    <div class="desktop-runtime__utility-block">
                      <span class="desktop-runtime__utility-label">Document mode</span>
                      <span class="desktop-runtime__utility-value">{session().workspaceMode}</span>
                    </div>
                    <div class="desktop-runtime__utility-block">
                      <span class="desktop-runtime__utility-label">Persistence</span>
                      <span class="desktop-runtime__utility-value">
                        {session().path ? session().path : "Unsaved desktop draft"}
                      </span>
                    </div>
                    <div class="desktop-runtime__utility-block">
                      <span class="desktop-runtime__utility-label">Extensions queued</span>
                      <span class="desktop-runtime__utility-value">
                        {desktopBootstrapPlan.extensionQueue.length}
                      </span>
                    </div>
                  </div>
                }
              />
              );
            }}
          </Show>
        </div>
      </div>
    </div>
  );
}