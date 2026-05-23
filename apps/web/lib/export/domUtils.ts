export const copyCanvasSnapshots = (sourceRoot: ParentNode, targetRoot: ParentNode) => {
  const sourceCanvases = Array.from(sourceRoot.querySelectorAll("canvas"));
  const targetCanvases = Array.from(targetRoot.querySelectorAll("canvas"));

  sourceCanvases.forEach((sourceCanvas, index) => {
    const targetCanvas = targetCanvases[index];
    if (!targetCanvas) {
      return;
    }

    targetCanvas.width = sourceCanvas.width;
    targetCanvas.height = sourceCanvas.height;

    const context = targetCanvas.getContext("2d");
    if (!context) {
      return;
    }

    try {
      context.drawImage(sourceCanvas, 0, 0);
    } catch {
      // Ignore canvases that cannot be copied and keep the cloned DOM structure intact.
    }
  });
};

export const normalizeFormControlsForExport = (root: HTMLElement) => {
  root.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    if (input.type === "checkbox" || input.type === "radio") {
      input.toggleAttribute("checked", input.checked);
      return;
    }

    if (input.type === "text" || input.type === "search" || input.type === "url") {
      const replacement = document.createElement("div");
      replacement.className = input.className || "";
      replacement.classList.add("export-form-value");
      replacement.textContent = input.value;
      input.replaceWith(replacement);
      return;
    }

    input.setAttribute("value", input.value);
  });

  root.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((textarea) => {
    const replacement = document.createElement("pre");
    replacement.className = textarea.className || "";
    replacement.textContent = textarea.value;
    textarea.replaceWith(replacement);
  });

  root.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
    Array.from(select.options).forEach((option) => {
      option.selected = option.value === select.value;
    });
  });
};

export const clonePrintableContent = (contentElement: HTMLElement) => {
  const clone = contentElement.cloneNode(true) as HTMLElement;

  clone
    .querySelectorAll("[data-export-ignore='true']")
    .forEach((node) => node.remove());

  normalizeFormControlsForExport(clone);

  clone
    .querySelectorAll("[contenteditable]")
    .forEach((node) => node.removeAttribute("contenteditable"));

  return clone;
};

export const collectHeadMarkup = () =>
  Array.from(document.head.querySelectorAll("style, link[rel='stylesheet']"))
    .map((node) => node.outerHTML)
    .join("\n");
