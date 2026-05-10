// Shared inline-style strings and tokens for compact toolbar controls

export const TOOLBAR_STYLES = {
  container: `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid #d9dde6;
    background: #f5f6f8;
    min-height: 44px;
  `,

  compactTrigger: `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 4px 8px;
    border: 1px solid #c3cad8;
    border-radius: 4px;
    background: #ffffff;
    color: #172033;
    font-size: 0.875rem;
    font-family: system-ui, -apple-system, sans-serif;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  `,

  compactTriggerFocus: `
    border-color: #005fcc;
    box-shadow: 0 0 0 2px rgba(0, 95, 204, 0.2);
  `,

  compactTriggerHover: `
    border-color: #8a90a0;
  `,

  dropdownPanel: `
    position: absolute;
    z-index: 1000;
    min-width: 200px;
    max-width: 360px;
    max-height: 400px;
    margin-top: 4px;
    padding: 8px;
    border: 1px solid #c3cad8;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(23, 32, 51, 0.12);
    overflow-y: auto;
  `,

  searchInput: `
    width: 100%;
    padding: 6px 8px;
    margin-bottom: 8px;
    border: 1px solid #c3cad8;
    border-radius: 4px;
    font-size: 0.875rem;
    outline: none;
  `,

  searchInputFocus: `
    border-color: #005fcc;
    box-shadow: 0 0 0 2px rgba(0, 95, 204, 0.15);
  `,

  listOption: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #172033;
    transition: background-color 0.1s;
  `,

  listOptionHover: `
    background: #f0f3f6;
  `,

  listOptionSelected: `
    background: #dce8ff;
    font-weight: 600;
  `,

  button: `
    min-width: 32px;
    min-height: 32px;
    padding: 6px 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: #172033;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    outline: none;
    transition: background-color 0.1s, border-color 0.1s;
  `,

  buttonActive: `
    background: #dce8ff;
    border-color: #89b3f0;
  `,

  buttonFocus: `
    box-shadow: 0 0 0 2px rgba(0, 95, 204, 0.3);
    outline: 2px solid #005fcc;
    outline-offset: 2px;
  `,

  buttonHover: `
    background: #f0f3f6;
  `,

  keytip: `
    position: absolute;
    top: -10px;
    right: -8px;
    z-index: 30;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #005fcc;
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 10px 18px rgba(0, 95, 204, 0.28);
    pointer-events: none;
  `,

  divider: `
    width: 1px;
    height: 24px;
    background: #d9dde6;
    margin: 0 4px;
  `,

  errorText: `
    margin-top: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    background: #fff5f5;
    color: #c41e3a;
    font-size: 0.75rem;
  `,

  label: `
    display: block;
    margin-bottom: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #5a606c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `
};
