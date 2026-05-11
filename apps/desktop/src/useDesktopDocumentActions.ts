import { desktopDocumentFileIO } from "./documentFileIO";
import { buildPdfBytes, buildPrintDocumentMarkup, sanitizeFileName } from "./desktopAppHelpers";
import {
  DEFAULT_BLANK_TITLE,
  buildDocumentDraft,
  createSessionFromFile,
  type DesktopDocumentSession,
  type DesktopStatusMessage,
  type StatusTone
} from "./desktopAppSessions";

interface DesktopDocumentActionsParams {
  hasDesktopFileIO: () => boolean;
  setIsWorking: (value: boolean) => void;
  setStatus: (text: string, tone?: StatusTone) => void;
  openEditorSession: (session: DesktopDocumentSession, status?: DesktopStatusMessage) => void;
  refreshRecentDocuments: () => Promise<void>;
  activeSession: () => DesktopDocumentSession | null;
}

export function useDesktopDocumentActions(params: DesktopDocumentActionsParams) {
  const { hasDesktopFileIO, setIsWorking, setStatus, openEditorSession, refreshRecentDocuments, activeSession } =
    params;

  const openDocument = async () => {
    if (!hasDesktopFileIO()) {
      setStatus("Open is only available inside the desktop shell.", "danger");
      return;
    }

    setIsWorking(true);
    try {
      const documentFile = await desktopDocumentFileIO.openDocumentDialog();
      if (!documentFile) {
        setStatus("Open canceled.");
        return;
      }

      openEditorSession(createSessionFromFile(documentFile), {
        tone: "success",
        text: `Opened ${documentFile.title}.`
      });
      await refreshRecentDocuments();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to open the selected document.", "danger");
    } finally {
      setIsWorking(false);
    }
  };

  const openRecentDocument = async (path: string) => {
    if (!hasDesktopFileIO()) {
      setStatus("Recent documents are only available inside the desktop shell.", "danger");
      return;
    }

    setIsWorking(true);
    try {
      const documentFile = await desktopDocumentFileIO.readDocumentFromPath(path);
      openEditorSession(createSessionFromFile(documentFile), {
        tone: "success",
        text: `Opened ${documentFile.title}.`
      });
      await refreshRecentDocuments();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to open the recent document.", "danger");
    } finally {
      setIsWorking(false);
    }
  };

  const saveCurrentSession = async (mode: "save" | "save-as" | "save-copy") => {
    const session = activeSession();
    if (!session) {
      return;
    }

    if (!hasDesktopFileIO()) {
      setStatus("Save is only available inside the desktop shell.", "danger");
      return;
    }

    setIsWorking(true);
    try {
      const draft = buildDocumentDraft(session);
      const suggestedName = `${sanitizeFileName(session.title, DEFAULT_BLANK_TITLE)}.monoscape`;

      if (mode === "save-copy") {
        const savedCopy = await desktopDocumentFileIO.saveDocumentCopy(draft, { suggestedName });
        if (!savedCopy) {
          setStatus("Save copy canceled.");
          return;
        }

        setStatus(`Saved a copy of ${session.title}.`, "success");
        await refreshRecentDocuments();
        return;
      }

      const savedDocument =
        mode === "save" && session.path
          ? await desktopDocumentFileIO.saveDocument(session.path, draft)
          : await desktopDocumentFileIO.saveDocumentAs(draft, {
              suggestedPath: session.path,
              suggestedName
            });

      if (!savedDocument) {
        setStatus(mode === "save" ? "Save canceled." : "Save As canceled.");
        return;
      }

      openEditorSession(createSessionFromFile(savedDocument), {
        tone: "success",
        text: `Saved ${savedDocument.title}.`
      });
      await refreshRecentDocuments();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save the current document.", "danger");
    } finally {
      setIsWorking(false);
    }
  };

  const exportCurrentSessionToPdf = async () => {
    const session = activeSession();
    if (!session) {
      return;
    }

    if (!hasDesktopFileIO()) {
      setStatus("PDF export is only available inside the desktop shell.", "danger");
      return;
    }

    setIsWorking(true);
    try {
      const exportResult = await desktopDocumentFileIO.exportPdfBytes(
        buildPdfBytes(session.title, session.editorHtml),
        { suggestedName: `${sanitizeFileName(session.title, DEFAULT_BLANK_TITLE)}.pdf` }
      );

      if (!exportResult) {
        setStatus("PDF export canceled.");
        return;
      }

      setStatus(`Exported ${session.title} to PDF.`, "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to export the current document.", "danger");
    } finally {
      setIsWorking(false);
    }
  };

  const printCurrentSession = () => {
    const session = activeSession();
    if (!session || typeof window === "undefined") {
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1080,height=820");
    if (!printWindow) {
      window.print();
      setStatus("Print dialog opened.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintDocumentMarkup(session.title, session.editorHtml));
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
    setStatus("Print dialog opened.");
  };

  return { openDocument, openRecentDocument, saveCurrentSession, exportCurrentSessionToPdf, printCurrentSession };
}
