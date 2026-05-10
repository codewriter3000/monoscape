import { defineExtension } from "@monoscape/extension-sdk";

export const reviewExtension = defineExtension({
  manifest: {
    id: "monoscape.review",
    name: "Review",
    version: "0.1.0",
    summary: "Keeps peer-review, instructor feedback, and revision cues in a dedicated surface.",
    surfaces: ["document.review-pane", "document.sidebar"],
    installStrategy: "bundled",
    permissions: ["document.read", "comments.manage", "tasks.manage"]
  },
  activate: () => ["review-queue", "feedback-summary"]
});
