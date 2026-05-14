#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  fs,
  io::ErrorKind,
  path::{Path, PathBuf},
  sync::Mutex,
  time::{SystemTime, UNIX_EPOCH},
};
use tauri::{
  api::{dialog::blocking::FileDialogBuilder, path::app_data_dir},
  AppHandle, State,
};

const GOOGLE_FONTS_API_URL: &str = "https://www.googleapis.com/webfonts/v1/webfonts";
const GOOGLE_FONTS_ENV_KEY: &str = "GOOGLE_WEBFONTSDEVAPI";
const MONOSCAPE_DOCUMENT_FORMAT: &str = "monoscape-document/v1";
const DEFAULT_DOCUMENT_SAVE_EXTENSION: &str = "docx";
const LEGACY_MONOSCAPE_DOCUMENT_EXTENSION: &str = "monoscape";
// These aliases currently wrap the same Monoscape JSON payload until format-specific exporters exist.
const SUPPORTED_DOCUMENT_EXTENSIONS: [&str; 6] = [
  "doc",
  "docx",
  "odt",
  "rtf",
  "txt",
  LEGACY_MONOSCAPE_DOCUMENT_EXTENSION,
];
const RECENT_DOCUMENT_LIMIT: usize = 20;

#[derive(Clone, Deserialize)]
struct GoogleFontsResponse {
  items: Vec<GoogleFontItem>,
}

#[derive(Clone, Deserialize)]
struct GoogleFontItem {
  family: String,
  category: String,
  variants: Vec<String>,
  subsets: Vec<String>,
  files: HashMap<String, String>,
}

#[derive(Default)]
struct GoogleFontsState {
  cache: Mutex<Option<Vec<GoogleFontItem>>>,
}

#[derive(Serialize)]
struct GoogleFontSummary {
  family: String,
  category: String,
  variants: Vec<String>,
  subsets: Vec<String>,
}

#[derive(Serialize)]
struct GoogleFontResolution {
  family: String,
  category: String,
}

#[derive(Serialize)]
struct GoogleFontResolutionResult {
  resolved: Vec<GoogleFontResolution>,
  missing: Vec<String>,
}

#[derive(Serialize)]
struct DownloadedFont {
  family: String,
  category: String,
  variant: String,
  relative_path: String,
}

#[derive(Serialize)]
struct UploadedFont {
  family: String,
  relative_path: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DocumentWriteRequest {
  title: String,
  workspace_mode: String,
  created_at: Option<u64>,
  editor_html: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DocumentSaveDialogRequest {
  document: DocumentWriteRequest,
  suggested_path: Option<String>,
  suggested_name: Option<String>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct MonoscapeDocumentFile {
  format: String,
  title: String,
  workspace_mode: String,
  created_at: u64,
  updated_at: u64,
  editor_html: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RecentDocumentRecord {
  title: String,
  path: String,
  workspace_mode: String,
  created_at: u64,
  updated_at: u64,
  last_modified: u64,
  file_size: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopDocumentFileRecord {
  title: String,
  path: String,
  workspace_mode: String,
  created_at: u64,
  updated_at: u64,
  editor_html: String,
  last_modified: u64,
  file_size: u64,
  available: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RecentDocumentListItem {
  title: String,
  path: String,
  workspace_mode: String,
  created_at: u64,
  updated_at: u64,
  last_modified: u64,
  file_size: u64,
  available: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PdfExportRequest {
  pdf_bytes: Vec<u8>,
  output_path: Option<String>,
  suggested_name: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PdfExportResult {
  path: String,
  file_size: u64,
  last_modified: u64,
}

struct FileMetadataSnapshot {
  last_modified: u64,
  file_size: u64,
}

fn get_google_fonts_key() -> Result<String, String> {
  std::env::var(GOOGLE_FONTS_ENV_KEY)
    .map_err(|_| "Google Fonts API key is not configured.".to_string())
}

async fn fetch_google_fonts(
  state: &GoogleFontsState,
  api_key: &str,
) -> Result<Vec<GoogleFontItem>, String> {
  if let Some(cached) = state
    .cache
    .lock()
    .map_err(|_| "Unable to access Google Fonts cache.".to_string())?
    .clone()
  {
    return Ok(cached);
  }

  let url = format!("{GOOGLE_FONTS_API_URL}?key={api_key}");
  let response = reqwest::Client::new()
    .get(url)
    .send()
    .await
    .map_err(|_| "Unable to reach Google Fonts API.".to_string())?;

  if !response.status().is_success() {
    return Err("Google Fonts API returned an error.".to_string());
  }

  let payload = response
    .json::<GoogleFontsResponse>()
    .await
    .map_err(|_| "Unable to parse Google Fonts response.".to_string())?;

  let mut cache = state
    .cache
    .lock()
    .map_err(|_| "Unable to update Google Fonts cache.".to_string())?;
  *cache = Some(payload.items.clone());

  Ok(payload.items)
}

fn normalize_family_key(value: &str) -> String {
  let mut normalized = String::new();
  let mut last_was_space = false;
  for ch in value.chars() {
    let mapped = if ch.is_ascii_alphanumeric() {
      ch.to_ascii_lowercase()
    } else {
      ' '
    };
    if mapped == ' ' {
      if !last_was_space {
        normalized.push(mapped);
      }
      last_was_space = true;
    } else {
      normalized.push(mapped);
      last_was_space = false;
    }
  }
  normalized.trim().to_string()
}

fn map_google_category(category: &str) -> String {
  match category {
    "serif" => "serif",
    "sans-serif" => "sans",
    "display" => "display",
    "handwriting" => "handwriting",
    "monospace" => "mono",
    _ => "custom",
  }
  .to_string()
}

fn sanitize_filename_component(value: &str) -> String {
  let mut sanitized = String::new();
  let mut last_was_dash = false;
  for ch in value.chars() {
    let mapped = if ch.is_ascii_alphanumeric() {
      ch.to_ascii_lowercase()
    } else {
      '-'
    };
    if mapped == '-' {
      if !last_was_dash {
        sanitized.push(mapped);
      }
      last_was_dash = true;
    } else {
      sanitized.push(mapped);
      last_was_dash = false;
    }
  }
  sanitized.trim_matches('-').to_string()
}

fn fonts_root(app: &AppHandle) -> Result<PathBuf, String> {
  let base = tauri::api::path::app_data_dir(&app.config())
    .ok_or_else(|| "Unable to resolve app data directory.".to_string())?;
  Ok(base.join("fonts"))
}

fn google_fonts_dir(app: &AppHandle) -> Result<PathBuf, String> {
  Ok(fonts_root(app)?.join("google"))
}

fn uploaded_fonts_dir(app: &AppHandle) -> Result<PathBuf, String> {
  Ok(fonts_root(app)?.join("uploaded"))
}

fn documents_root(app: &AppHandle) -> Result<PathBuf, String> {
  Ok(app_data_root(app)?.join("documents"))
}

fn recent_documents_registry_path(app: &AppHandle) -> Result<PathBuf, String> {
  Ok(documents_root(app)?.join("recent-documents.json"))
}

fn app_data_root(app: &AppHandle) -> Result<PathBuf, String> {
  app_data_dir(&app.config()).ok_or_else(|| "Unable to resolve app data directory.".to_string())
}

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent)
      .map_err(|_| "Unable to create the destination directory.".to_string())?;
  }
  Ok(())
}

fn system_time_to_timestamp_ms(value: SystemTime) -> Option<u64> {
  value
    .duration_since(UNIX_EPOCH)
    .ok()
    .and_then(|duration| u64::try_from(duration.as_millis()).ok())
}

fn now_timestamp_ms() -> u64 {
  system_time_to_timestamp_ms(SystemTime::now()).unwrap_or_default()
}

fn normalize_document_title(value: &str) -> String {
  let trimmed = value.trim();
  if trimmed.is_empty() {
    "Untitled document".to_string()
  } else {
    trimmed.to_string()
  }
}

fn normalize_workspace_mode(value: &str) -> String {
  let trimmed = value.trim();
  if trimmed.is_empty() {
    "notes".to_string()
  } else {
    trimmed.to_string()
  }
}

fn normalize_document_path_key(path: &Path) -> String {
  let raw = path.to_string_lossy().replace('/', "\\");
  if cfg!(windows) {
    raw.to_ascii_lowercase()
  } else {
    raw
  }
}

fn path_from_input(path: &str, missing_message: &str) -> Result<PathBuf, String> {
  let trimmed = path.trim();
  if trimmed.is_empty() {
    return Err(missing_message.to_string());
  }
  Ok(PathBuf::from(trimmed))
}

fn ensure_path_extension(path: PathBuf, extension: &str) -> PathBuf {
  let has_extension = path
    .extension()
    .and_then(|value| value.to_str())
    .map(|value| value.eq_ignore_ascii_case(extension))
    .unwrap_or(false);

  if has_extension {
    path
  } else {
    path.with_extension(extension)
  }
}

fn path_has_supported_document_extension(path: &Path) -> bool {
  path
    .extension()
    .and_then(|value| value.to_str())
    .map(|value| {
      SUPPORTED_DOCUMENT_EXTENSIONS
        .iter()
        .any(|extension| value.eq_ignore_ascii_case(extension))
    })
    .unwrap_or(false)
}

fn ensure_document_path_extension(path: PathBuf) -> PathBuf {
  if path_has_supported_document_extension(&path) {
    path
  } else {
    path.with_extension(DEFAULT_DOCUMENT_SAVE_EXTENSION)
  }
}

fn unsupported_document_contents_message() -> String {
  "Monoscape can only reopen files it saved itself. DOC, DOCX, ODT, TXT, RTF, and .monoscape files currently store the same Monoscape document wrapper payload.".to_string()
}

fn suggested_document_filename(title: &str) -> String {
  let title = normalize_document_title(title);
  if path_has_supported_document_extension(Path::new(&title)) {
    title
  } else {
    format!("{title}.{DEFAULT_DOCUMENT_SAVE_EXTENSION}")
  }
}

fn add_document_dialog_filters(builder: FileDialogBuilder) -> FileDialogBuilder {
  builder.add_filter("Monoscape documents", &SUPPORTED_DOCUMENT_EXTENSIONS)
}

fn configure_document_save_dialog(
  title: &str,
  suggested_path: Option<&str>,
  suggested_name: &str,
) -> FileDialogBuilder {
  let mut builder = add_document_dialog_filters(FileDialogBuilder::new().set_title(title));
  builder = builder
    .add_filter("Word document", &["docx"])
    .add_filter("Word 97-2003 document", &["doc"])
    .add_filter("OpenDocument text", &["odt"])
    .add_filter("Rich Text Format", &["rtf"])
    .add_filter("Plain text", &["txt"])
    .add_filter("Legacy Monoscape document", &[LEGACY_MONOSCAPE_DOCUMENT_EXTENSION]);

  if let Some(path) = suggested_path
    .map(str::trim)
    .filter(|value| !value.is_empty())
    .map(PathBuf::from)
  {
    if let Some(parent) = path.parent().filter(|parent| !parent.as_os_str().is_empty()) {
      builder = builder.set_directory(parent.to_path_buf());
    }

    if let Some(file_name) = path.file_name().and_then(|value| value.to_str()) {
      return builder.set_file_name(file_name);
    }
  }

  builder.set_file_name(suggested_name)
}

fn suggested_pdf_filename(name: Option<&str>) -> String {
  let base = name
    .map(str::trim)
    .filter(|value| !value.is_empty())
    .unwrap_or("monoscape-export");
  if base.to_ascii_lowercase().ends_with(".pdf") {
    base.to_string()
  } else {
    format!("{base}.pdf")
  }
}

fn configure_save_dialog(
  title: &str,
  filter_name: &str,
  extension: &str,
  suggested_path: Option<&str>,
  suggested_name: &str,
) -> FileDialogBuilder {
  let mut builder = FileDialogBuilder::new()
    .set_title(title)
    .add_filter(filter_name, &[extension]);

  if let Some(path) = suggested_path
    .map(str::trim)
    .filter(|value| !value.is_empty())
    .map(PathBuf::from)
  {
    if let Some(parent) = path.parent().filter(|parent| !parent.as_os_str().is_empty()) {
      builder = builder.set_directory(parent.to_path_buf());
    }

    if let Some(file_name) = path.file_name().and_then(|value| value.to_str()) {
      return builder.set_file_name(file_name);
    }
  }

  builder.set_file_name(suggested_name)
}

fn file_metadata_snapshot(path: &Path) -> Result<FileMetadataSnapshot, String> {
  let metadata = fs::metadata(path).map_err(|_| "Unable to read file metadata.".to_string())?;
  let last_modified = metadata
    .modified()
    .ok()
    .and_then(system_time_to_timestamp_ms)
    .unwrap_or_default();

  Ok(FileMetadataSnapshot {
    last_modified,
    file_size: metadata.len(),
  })
}

fn read_document_payload(path: &Path) -> Result<MonoscapeDocumentFile, String> {
  let contents = fs::read_to_string(path).map_err(|_| "Unable to read document file.".to_string())?;
  let document = serde_json::from_str::<MonoscapeDocumentFile>(&contents)
    .map_err(|_| unsupported_document_contents_message())?;

  if document.format != MONOSCAPE_DOCUMENT_FORMAT {
    return Err(unsupported_document_contents_message());
  }

  Ok(document)
}

fn build_document_record(
  path: &Path,
  document: MonoscapeDocumentFile,
) -> Result<DesktopDocumentFileRecord, String> {
  let metadata = file_metadata_snapshot(path)?;
  Ok(DesktopDocumentFileRecord {
    title: document.title,
    path: path.to_string_lossy().to_string(),
    workspace_mode: document.workspace_mode,
    created_at: document.created_at,
    updated_at: document.updated_at,
    editor_html: document.editor_html,
    last_modified: metadata.last_modified,
    file_size: metadata.file_size,
    available: true,
  })
}

fn load_recent_documents(app: &AppHandle) -> Result<Vec<RecentDocumentRecord>, String> {
  let path = recent_documents_registry_path(app)?;
  match fs::read_to_string(path) {
    Ok(contents) => Ok(serde_json::from_str::<Vec<RecentDocumentRecord>>(&contents).unwrap_or_default()),
    Err(error) if error.kind() == ErrorKind::NotFound => Ok(Vec::new()),
    Err(_) => Err("Unable to read recent documents registry.".to_string()),
  }
}

fn persist_recent_documents(
  app: &AppHandle,
  recent_documents: &[RecentDocumentRecord],
) -> Result<(), String> {
  let path = recent_documents_registry_path(app)?;
  ensure_parent_dir(&path)?;
  let payload = serde_json::to_vec_pretty(recent_documents)
    .map_err(|_| "Unable to serialize recent documents.".to_string())?;
  fs::write(path, payload).map_err(|_| "Unable to store recent documents.".to_string())
}

fn record_recent_document(
  app: &AppHandle,
  document: &DesktopDocumentFileRecord,
) -> Result<(), String> {
  let mut recent_documents = load_recent_documents(app)?;
  let document_key = normalize_document_path_key(Path::new(&document.path));

  recent_documents.retain(|entry| {
    normalize_document_path_key(Path::new(&entry.path)) != document_key
  });

  recent_documents.insert(
    0,
    RecentDocumentRecord {
      title: document.title.clone(),
      path: document.path.clone(),
      workspace_mode: document.workspace_mode.clone(),
      created_at: document.created_at,
      updated_at: document.updated_at,
      last_modified: document.last_modified,
      file_size: document.file_size,
    },
  );

  if recent_documents.len() > RECENT_DOCUMENT_LIMIT {
    recent_documents.truncate(RECENT_DOCUMENT_LIMIT);
  }

  persist_recent_documents(app, &recent_documents)
}

fn read_document_from_disk(
  path: &Path,
  app: &AppHandle,
) -> Result<DesktopDocumentFileRecord, String> {
  let document = read_document_payload(path)?;
  let record = build_document_record(path, document)?;
  record_recent_document(app, &record)?;
  Ok(record)
}

fn write_document_to_path(
  path: &Path,
  document: DocumentWriteRequest,
  app: &AppHandle,
) -> Result<DesktopDocumentFileRecord, String> {
  ensure_parent_dir(path)?;

  let now = now_timestamp_ms();
  let payload = MonoscapeDocumentFile {
    format: MONOSCAPE_DOCUMENT_FORMAT.to_string(),
    title: normalize_document_title(&document.title),
    workspace_mode: normalize_workspace_mode(&document.workspace_mode),
    created_at: document.created_at.unwrap_or(now),
    updated_at: now,
    editor_html: document.editor_html,
  };

  let serialized = serde_json::to_vec_pretty(&payload)
    .map_err(|_| "Unable to serialize document file.".to_string())?;
  fs::write(path, serialized).map_err(|_| "Unable to save document file.".to_string())?;

  let record = build_document_record(path, payload)?;
  record_recent_document(app, &record)?;
  Ok(record)
}

#[tauri::command]
async fn google_fonts_search(
  query: String,
  limit: Option<usize>,
  state: State<'_, GoogleFontsState>,
) -> Result<Vec<GoogleFontSummary>, String> {
  let normalized_query = query.trim().to_lowercase();
  if normalized_query.is_empty() {
    return Ok(Vec::new());
  }

  let api_key = get_google_fonts_key()?;
  let fonts = fetch_google_fonts(&state, &api_key).await?;
  let max_results = limit.unwrap_or(20);

  let mut results: Vec<GoogleFontSummary> = fonts
    .into_iter()
    .filter(|font| font.family.to_lowercase().contains(&normalized_query))
    .map(|font| GoogleFontSummary {
      family: font.family,
      category: map_google_category(&font.category),
      variants: font.variants,
      subsets: font.subsets,
    })
    .collect();

  results.sort_by(|left, right| left.family.cmp(&right.family));
  results.truncate(max_results);
  Ok(results)
}

#[tauri::command]
async fn google_fonts_resolve_families(
  families: Vec<String>,
  state: State<'_, GoogleFontsState>,
) -> Result<GoogleFontResolutionResult, String> {
  let api_key = get_google_fonts_key()?;
  let fonts = fetch_google_fonts(&state, &api_key).await?;

  let mut lookup = HashMap::new();
  for font in fonts {
    lookup.insert(normalize_family_key(&font.family), font);
  }

  let mut resolved = Vec::new();
  let mut missing = Vec::new();
  for family in families {
    let key = normalize_family_key(&family);
    if let Some(font) = lookup.get(&key) {
      resolved.push(GoogleFontResolution {
        family: font.family.clone(),
        category: map_google_category(&font.category),
      });
    } else {
      missing.push(family);
    }
  }

  Ok(GoogleFontResolutionResult { resolved, missing })
}

#[tauri::command]
async fn google_fonts_download(
  family: String,
  variant: Option<String>,
  app: AppHandle,
  state: State<'_, GoogleFontsState>,
) -> Result<DownloadedFont, String> {
  let api_key = get_google_fonts_key()?;
  let fonts = fetch_google_fonts(&state, &api_key).await?;
  let family_key = normalize_family_key(&family);
  let font = fonts
    .into_iter()
    .find(|font| normalize_family_key(&font.family) == family_key)
    .ok_or_else(|| "Requested font family not found.".to_string())?;

  let selected_variant = variant
    .as_ref()
    .filter(|requested| font.files.contains_key(*requested))
    .cloned()
    .or_else(|| {
      if font.files.contains_key("regular") {
        Some("regular".to_string())
      } else {
        font.files.keys().next().cloned()
      }
    })
    .ok_or_else(|| "No downloadable font variant found.".to_string())?;

  let url = font
    .files
    .get(&selected_variant)
    .ok_or_else(|| "No downloadable font variant found.".to_string())?;

  let download_dir = google_fonts_dir(&app)?;
  std::fs::create_dir_all(&download_dir)
    .map_err(|_| "Unable to create Google Fonts cache directory.".to_string())?;

  let extension = url
    .split('?')
    .next()
    .and_then(|path| path.rsplit('.').next())
    .unwrap_or("woff2");
  let filename = format!(
    "{}-{}.{}",
    sanitize_filename_component(&font.family),
    sanitize_filename_component(&selected_variant),
    extension
  );
  let destination = download_dir.join(&filename);

  if !destination.exists() {
    let bytes = reqwest::get(url)
      .await
      .map_err(|_| "Unable to download font file.".to_string())?
      .bytes()
      .await
      .map_err(|_| "Unable to read font download.".to_string())?;
    std::fs::write(&destination, &bytes)
      .map_err(|_| "Unable to save downloaded font.".to_string())?;
  }

  let relative_path = destination
    .strip_prefix(fonts_root(&app)?)
    .map_err(|_| "Unable to resolve font storage path.".to_string())?
    .to_string_lossy()
    .to_string();

  Ok(DownloadedFont {
    family: font.family,
    category: map_google_category(&font.category),
    variant: selected_variant,
    relative_path,
  })
}

#[tauri::command]
async fn import_font_file(
  source_path: String,
  app: AppHandle,
) -> Result<UploadedFont, String> {
  let source = PathBuf::from(source_path);
  let extension = source
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_ascii_lowercase())
    .ok_or_else(|| "Unsupported file format.".to_string())?;
  let allowed = ["ttf", "otf", "woff", "woff2"];
  if !allowed.contains(&extension.as_str()) {
    return Err("Unsupported file format.".to_string());
  }

  let file_stem = source
    .file_stem()
    .and_then(|stem| stem.to_str())
    .ok_or_else(|| "Unable to read font file name.".to_string())?;
  let family = file_stem.trim().to_string();
  let sanitized_name = sanitize_filename_component(file_stem);
  if sanitized_name.is_empty() {
    return Err("Unable to sanitize font file name.".to_string());
  }

  let upload_dir = uploaded_fonts_dir(&app)?;
  std::fs::create_dir_all(&upload_dir)
    .map_err(|_| "Unable to create font upload directory.".to_string())?;

  let destination = upload_dir.join(format!("{sanitized_name}.{extension}"));
  std::fs::copy(&source, &destination)
    .map_err(|_| "Unable to store uploaded font file.".to_string())?;

  let relative_path = destination
    .strip_prefix(fonts_root(&app)?)
    .map_err(|_| "Unable to resolve uploaded font path.".to_string())?
    .to_string_lossy()
    .to_string();

  Ok(UploadedFont {
    family,
    relative_path,
  })
}

#[tauri::command]
fn open_document_dialog(app: AppHandle) -> Result<Option<DesktopDocumentFileRecord>, String> {
  let selected = add_document_dialog_filters(FileDialogBuilder::new().set_title("Open document"))
    .pick_file();

  let Some(path) = selected else {
    return Ok(None);
  };

  read_document_from_disk(&path, &app).map(Some)
}

#[tauri::command]
fn read_document_from_path(
  path: String,
  app: AppHandle,
) -> Result<DesktopDocumentFileRecord, String> {
  let path = path_from_input(&path, "A document path is required.")?;
  read_document_from_disk(&path, &app)
}

#[tauri::command]
fn save_document_to_path(
  path: String,
  document: DocumentWriteRequest,
  app: AppHandle,
) -> Result<DesktopDocumentFileRecord, String> {
  let path = path_from_input(&path, "A document path is required.")?;
  write_document_to_path(&path, document, &app)
}

#[tauri::command]
fn save_document_as_dialog(
  request: DocumentSaveDialogRequest,
  app: AppHandle,
) -> Result<Option<DesktopDocumentFileRecord>, String> {
  let fallback_name = request
    .suggested_name
    .clone()
    .unwrap_or_else(|| suggested_document_filename(&request.document.title));
  let selected = configure_document_save_dialog(
    "Save document",
    request.suggested_path.as_deref(),
    &fallback_name,
  )
  .save_file();

  let Some(path) = selected else {
    return Ok(None);
  };

  let path = ensure_document_path_extension(path);
  write_document_to_path(&path, request.document, &app).map(Some)
}

#[tauri::command]
fn save_document_copy_dialog(
  request: DocumentSaveDialogRequest,
  app: AppHandle,
) -> Result<Option<DesktopDocumentFileRecord>, String> {
  let fallback_name = request
    .suggested_name
    .clone()
    .unwrap_or_else(|| suggested_document_filename(&request.document.title));
  let selected = configure_document_save_dialog(
    "Save document copy",
    request.suggested_path.as_deref(),
    &fallback_name,
  )
  .save_file();

  let Some(path) = selected else {
    return Ok(None);
  };

  let path = ensure_document_path_extension(path);
  write_document_to_path(&path, request.document, &app).map(Some)
}

#[cfg(test)]
mod tests {
  use super::{
    ensure_document_path_extension, suggested_document_filename, unsupported_document_contents_message,
  };
  use std::path::PathBuf;

  #[test]
  fn defaults_unsuffixed_document_paths_to_docx() {
    assert_eq!(
      ensure_document_path_extension(PathBuf::from("C:/drafts/semester-plan")),
      PathBuf::from("C:/drafts/semester-plan.docx")
    );
  }

  #[test]
  fn preserves_supported_alias_extensions() {
    assert_eq!(
      ensure_document_path_extension(PathBuf::from("C:/drafts/semester-plan.rtf")),
      PathBuf::from("C:/drafts/semester-plan.rtf")
    );
  }

  #[test]
  fn suggested_document_names_default_to_docx() {
    assert_eq!(suggested_document_filename("Seminar Notes"), "Seminar Notes.docx");
  }

  #[test]
  fn unsupported_document_message_explains_alias_limit() {
    let message = unsupported_document_contents_message();
    assert!(message.contains("Monoscape can only reopen files it saved itself"));
    assert!(message.contains("DOCX"));
    assert!(message.contains("RTF"));
  }
}

#[tauri::command]
fn list_recent_documents(app: AppHandle) -> Result<Vec<RecentDocumentListItem>, String> {
  let mut recent_documents = load_recent_documents(&app)?;
  let mut changed = false;
  let mut items = Vec::with_capacity(recent_documents.len());

  for entry in recent_documents.iter_mut() {
    let path = PathBuf::from(&entry.path);
    let available = path.is_file();

    if available {
      if let Ok(metadata) = file_metadata_snapshot(&path) {
        if entry.last_modified != metadata.last_modified || entry.file_size != metadata.file_size {
          entry.last_modified = metadata.last_modified;
          entry.file_size = metadata.file_size;
          changed = true;
        }
      }
    }

    items.push(RecentDocumentListItem {
      title: entry.title.clone(),
      path: entry.path.clone(),
      workspace_mode: entry.workspace_mode.clone(),
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      last_modified: entry.last_modified,
      file_size: entry.file_size,
      available,
    });
  }

  if changed {
    persist_recent_documents(&app, &recent_documents)?;
  }

  items.sort_by(|left, right| {
    right
      .last_modified
      .cmp(&left.last_modified)
      .then_with(|| right.updated_at.cmp(&left.updated_at))
      .then_with(|| left.title.cmp(&right.title))
  });

  Ok(items)
}

#[tauri::command]
fn export_pdf_bytes(request: PdfExportRequest) -> Result<Option<PdfExportResult>, String> {
  let target = if let Some(path) = request.output_path.as_deref() {
    ensure_path_extension(path_from_input(path, "A PDF output path is required.")?, "pdf")
  } else {
    let suggested_name = suggested_pdf_filename(request.suggested_name.as_deref());
    let selected = configure_save_dialog("Export PDF", "PDF", "pdf", None, &suggested_name)
      .save_file();

    let Some(path) = selected else {
      return Ok(None);
    };

    ensure_path_extension(path, "pdf")
  };

  ensure_parent_dir(&target)?;
  fs::write(&target, request.pdf_bytes).map_err(|_| "Unable to export PDF.".to_string())?;

  let metadata = file_metadata_snapshot(&target)?;
  Ok(Some(PdfExportResult {
    path: target.to_string_lossy().to_string(),
    file_size: metadata.file_size,
    last_modified: metadata.last_modified,
  }))
}

fn main() {
  dotenvy::dotenv().ok();
  tauri::Builder::default()
    .manage(GoogleFontsState::default())
    .invoke_handler(tauri::generate_handler![
      google_fonts_search,
      google_fonts_resolve_families,
      google_fonts_download,
      import_font_file,
      open_document_dialog,
      read_document_from_path,
      save_document_to_path,
      save_document_as_dialog,
      save_document_copy_dialog,
      list_recent_documents,
      export_pdf_bytes
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
