export const TASK_LIST_PATTERN = /^[ ]{0,3}[-*+]\s+\[(?: |x|X)\](?:\s+.*)?$/;
export const TASK_LIST_ITEM_PATTERN = /^[ ]{0,3}[-*+]\s+\[( |x|X)\](?:\s+(.*))?$/;
export const BULLET_LIST_PATTERN = /^[ ]{0,3}[-*+]\s+(?!\[(?: |x|X)\](?:\s|$))(.*)$/;
export const ORDERED_LIST_PATTERN = /^[ ]{0,3}\d+\.\s+(.*)$/;
export const BLOCKQUOTE_PATTERN = /^[ ]{0,3}>\s?(.*)$/;
export const TOGGLE_SUMMARY_PATTERN = /^[ ]{0,3}>!\s?(.*)$/;
export const TOGGLE_OPEN_SUMMARY_PATTERN = /^[ ]{0,3}>>\s?(.*)$/;
export const HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
export const HORIZONTAL_RULE_PATTERN = /^(?:---|\*\*\*|___)\s*$/;
export const CODE_FENCE_PATTERN = /^```/;
export const DETAILS_OPEN_PATTERN = /^<details(?:\s+open)?[^>]*>\s*$/i;
export const DETAILS_CLOSE_PATTERN = /^<\/details>\s*$/i;
export const DETAILS_SUMMARY_PATTERN = /^<summary>(.*?)<\/summary>\s*$/i;

export const CODE_BLOCK_LANGUAGE_ALIASES: Record<string, string> = {
  htm: "html",
  xhtml: "html",
  cjs: "javascript",
  js: "javascript",
  jsx: "react",
  mjs: "javascript",
  sh: "bash",
  shell: "bash",
  terminal: "bash",
  ts: "typescript",
  tsx: "react-ts",
  txt: "plaintext",
  text: "plaintext",
};
