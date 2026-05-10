#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, sync::Mutex};
use tauri::{AppHandle, State};

const GOOGLE_FONTS_API_URL: &str = "https://www.googleapis.com/webfonts/v1/webfonts";
const GOOGLE_FONTS_ENV_KEY: &str = "GOOGLE_WEBFONTSDEVAPI";

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

fn main() {
  dotenvy::dotenv().ok();
  tauri::Builder::default()
    .manage(GoogleFontsState::default())
    .invoke_handler(tauri::generate_handler![
      google_fonts_search,
      google_fonts_resolve_families,
      google_fonts_download,
      import_font_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
