import { FileText, Palette, Database, Network } from "lucide-react";
import type { PageType } from "@obnofi/types";

export const typeIcons: Record<PageType, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  canvas: <Palette className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  mindmap: <Network className="w-4 h-4" />,
};
