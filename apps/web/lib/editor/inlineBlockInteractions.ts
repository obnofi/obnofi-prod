export function preventInlineBlockDrag(event: React.DragEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function shouldStopInlineBlockEvent(event: Event) {
  if (
    event.type === "pointerdown" ||
    event.type === "mousedown" ||
    event.type === "click" ||
    event.type === "dragstart"
  ) {
    return true;
  }

  const target = event.target as HTMLElement | null;

  return (
    ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target?.tagName ?? "") ||
    Boolean(target?.isContentEditable)
  );
}
