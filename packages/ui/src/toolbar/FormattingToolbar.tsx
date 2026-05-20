import { onCleanup, onMount } from "solid-js";
import "./toolbar.css";
import { formatLineSpacingValue, labelLineSpacingOption } from "./constants";
import { ComboField } from "./components/ComboField";
import { FontPickerDropdown } from "./components/FontPickerDropdown";
import { ColorPickerDropdown } from "./components/ColorPickerDropdown";
import { StyleSetDropdown } from "./components/StyleSetDropdown";
import { InlineFormatButtons } from "./components/InlineFormatButtons";
import { AlignmentButtons } from "./components/AlignmentButtons";
import { IndentOutdentButtons } from "./components/IndentOutdentButtons";
import {
  type FontCatalogEntry,
  type TextAlignment,
  type NormalizedColor,
  type AcademicStyleSetId,
  type AcademicBlockStyleId
} from "@monoscape/document-core";
import { useFormattingToolbarState } from "./useFormattingToolbarState";
import { useToolbarInteractions } from "./useToolbarInteractions";
import { ImageInsertButton } from "./components/ImageInsertButton";

interface FormattingToolbarProps {
  editorRef: () => HTMLDivElement | undefined;
  registerPrimaryFocusTarget?: (focusTarget: (() => void) | null) => void;
  onNavigateOut?: (direction: "next" | "prev") => void;
  fonts: FontCatalogEntry[];
  selectedFontFamily: string | null;
  selectedFontSize: number | null;
  selectedAlignment: TextAlignment | null;
  selectedLineSpacing: number | null;
  selectedColor?: NormalizedColor | null;
  userFonts?: FontCatalogEntry[];
  fontCapabilities?: {
    searchGoogleFonts?: (query: string) => Promise<FontCatalogEntry[]>;
    uploadFonts?: boolean;
  };
  onFontFamilyChange: (fontFamily: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onAlignmentChange: (alignment: TextAlignment) => void;
  onLineSpacingChange: (lineSpacing: number) => void;
  onColorChange?: (color: NormalizedColor | null) => void;
  onIndent: () => void;
  onOutdent: () => void;
  onStyleSetApply?: (styleSetId: AcademicStyleSetId, blockStyleId: AcademicBlockStyleId) => void;
  onAddCatalogFont?: (font: FontCatalogEntry) => void;
  onRemoveFont?: (fontId: string) => void;
  onUploadFonts?: (fileList: FileList | null) => Promise<void>;
  onInsertImageFromFile?: () => void;
  onInsertImageFromUrl?: (url: string) => void;
}

export function FormattingToolbar(props: FormattingToolbarProps) {
  const toolbarState = useFormattingToolbarState({
    editorRef: props.editorRef,
    selectedFontSize: () => props.selectedFontSize,
    selectedLineSpacing: () => props.selectedLineSpacing,
    onFontSizeChange: props.onFontSizeChange,
    onLineSpacingChange: props.onLineSpacingChange
  });
  let fontSizeInputRef: HTMLInputElement | undefined;
  let lineSpacingInputRef: HTMLInputElement | undefined;
  let fontTriggerRef: HTMLButtonElement | undefined;
  let fontPickerRef: HTMLDivElement | undefined;
  let fontSizeControlRef: HTMLDivElement | undefined;
  let lineSpacingControlRef: HTMLDivElement | undefined;
  let colorPickerRef: HTMLDivElement | undefined;
  let styleSetRef: HTMLDivElement | undefined;

  const {
    buttonRefs,
    handleButtonRowKeyDown,
    renderKeytip,
    isKeytipMode,
    setIsKeytipMode
  } = useToolbarInteractions({
    onNavigateOut: props.onNavigateOut,
    focusEditor: toolbarState.focusEditor,
    setIsFontPickerOpen: toolbarState.setIsFontPickerOpen,
    setIsColorPickerOpen: toolbarState.setIsColorPickerOpen,
    setIsStyleSetOpen: toolbarState.setIsStyleSetOpen,
    getFontSizeInput: () => fontSizeInputRef,
    getLineSpacingInput: () => lineSpacingInputRef
  });

  const fontSizeListId = "monoscape-font-size-list";
  const lineSpacingListId = "monoscape-line-spacing-list";

  const fontSizePlaceholder = () => (props.selectedFontSize === null ? "Mixed" : "Size");
  const lineSpacingPlaceholder = () =>
    props.selectedLineSpacing === null ? "Mixed" : "Spacing";

  onMount(() => {
    props.registerPrimaryFocusTarget?.(() => fontTriggerRef?.focus());

    const handlePointerDown = (event: MouseEvent) => {
      setIsKeytipMode(false);
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (fontPickerRef && !fontPickerRef.contains(target)) {
        toolbarState.setIsFontPickerOpen(false);
      }
      if (fontSizeControlRef && !fontSizeControlRef.contains(target)) {
        toolbarState.setIsFontSizeMenuOpen(false);
      }
      if (lineSpacingControlRef && !lineSpacingControlRef.contains(target)) {
        toolbarState.setIsLineSpacingMenuOpen(false);
      }
      if (colorPickerRef && !colorPickerRef.contains(target)) {
        toolbarState.setIsColorPickerOpen(false);
      }
      if (styleSetRef && !styleSetRef.contains(target)) {
        toolbarState.setIsStyleSetOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    onCleanup(() => {
      props.registerPrimaryFocusTarget?.(null);
      document.removeEventListener("mousedown", handlePointerDown);
    });
  });

  return (
    <div role="toolbar" aria-label="Text formatting" class="toolbar__container">
      <div class="toolbar__row">
        <FontPickerDropdown
        fonts={props.fonts}
        selectedFontFamily={props.selectedFontFamily}
        isOpen={toolbarState.isFontPickerOpen()}
        onOpenChange={toolbarState.setIsFontPickerOpen}
        onFontSelect={props.onFontFamilyChange}
        focusEditor={toolbarState.focusEditor}
        onNavigateOut={props.onNavigateOut}
        fontCapabilities={props.fontCapabilities}
        onAddCatalogFont={props.onAddCatalogFont}
        onRemoveFont={props.onRemoveFont}
        onUploadFonts={props.onUploadFonts}
        containerRef={(el) => (fontPickerRef = el)}
        triggerRef={(el) => (fontTriggerRef = el)}
        renderKeytip={() => renderKeytip("fontFamily")}
      />

      <ComboField
        value={toolbarState.fontSizeDraft()}
        options={toolbarState.visibleFontSizes()}
        getOptionValue={(opt) => String(opt)}
        getOptionLabel={(opt) => `${opt}pt`}
        label="Font size"
        placeholder={fontSizePlaceholder()}
        ariaLabel="Font size"
        listId={fontSizeListId}
        error={toolbarState.fontSizeError()}
        isOpen={toolbarState.isFontSizeMenuOpen()}
        onOpenChange={toolbarState.setIsFontSizeMenuOpen}
        onValueChange={toolbarState.setFontSizeDraft}
        onCommit={toolbarState.handleFontSizeCommit}
        onNavigateOut={props.onNavigateOut}
        containerRef={(el) => (fontSizeControlRef = el)}
        inputRef={(el) => (fontSizeInputRef = el)}
        renderKeytip={() => renderKeytip("fontSize")}
      />

      <ComboField
        value={toolbarState.lineSpacingDraft()}
        options={toolbarState.visibleLineSpacingOptions()}
        getOptionValue={(opt) => formatLineSpacingValue(opt)}
        getOptionLabel={(opt) => labelLineSpacingOption(opt)}
        label="Line spacing"
        placeholder={lineSpacingPlaceholder()}
        ariaLabel="Line spacing"
        listId={lineSpacingListId}
        error={toolbarState.lineSpacingError()}
        isOpen={toolbarState.isLineSpacingMenuOpen()}
        onOpenChange={toolbarState.setIsLineSpacingMenuOpen}
        onValueChange={toolbarState.setLineSpacingDraft}
        onCommit={toolbarState.handleLineSpacingCommit}
        onNavigateOut={props.onNavigateOut}
        containerRef={(el) => (lineSpacingControlRef = el)}
        inputRef={(el) => (lineSpacingInputRef = el)}
        renderKeytip={() => renderKeytip("lineSpacing")}
      />

      <div class="toolbar__divider" aria-hidden="true" />

      <ColorPickerDropdown
        value={props.selectedColor ?? null}
        isOpen={toolbarState.isColorPickerOpen()}
        onChange={(color) => props.onColorChange?.(color)}
        onOpenChange={toolbarState.setIsColorPickerOpen}
        onNavigateOut={props.onNavigateOut}
        containerRef={(el) => (colorPickerRef = el)}
        renderKeytip={() => renderKeytip("color")}
      />

      <StyleSetDropdown
        isOpen={toolbarState.isStyleSetOpen()}
        onOpenChange={toolbarState.setIsStyleSetOpen}
        onStyleApply={(styleSetId, blockStyleId) =>
          props.onStyleSetApply?.(styleSetId, blockStyleId)
        }
        onNavigateOut={props.onNavigateOut}
        containerRef={(el) => (styleSetRef = el)}
        renderKeytip={() => renderKeytip("styles")}
      />
      </div>

      <div class="toolbar__row--centered">
        <InlineFormatButtons
        state={toolbarState.formattingState()}
        isKeytipMode={isKeytipMode()}
        onFormat={toolbarState.execInlineFormat}
        buttonRefs={buttonRefs}
        onButtonKeyDown={handleButtonRowKeyDown}
        renderKeytip={renderKeytip}
      />

      <div class="toolbar__divider" aria-hidden="true" />

      <AlignmentButtons
        selectedAlignment={props.selectedAlignment}
        isKeytipMode={isKeytipMode()}
        onAlignmentChange={props.onAlignmentChange}
        buttonRefs={buttonRefs}
        onButtonKeyDown={handleButtonRowKeyDown}
        renderKeytip={renderKeytip}
      />

      <div class="toolbar__divider" aria-hidden="true" />

      <IndentOutdentButtons
        buttonRefs={buttonRefs}
        onButtonKeyDown={handleButtonRowKeyDown}
        renderKeytip={renderKeytip}
        onIndent={props.onIndent}
        onOutdent={props.onOutdent}
      />

      <div class="toolbar__divider" aria-hidden="true" />

      <ImageInsertButton
        onInsertFromFile={() => props.onInsertImageFromFile?.()}
        onInsertFromUrl={(url) => props.onInsertImageFromUrl?.(url)}
      />

      </div>
    </div>
  );
}
