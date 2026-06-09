import { create } from "zustand";
import type {
  GraphLinkEdge,
  GraphLinkNode,
} from "@/components/graph/useGraphData";

/** d3-force 시뮬레이션 튜닝 값. Obsidian 그래프의 Forces 패널과 동일한 개념. */
export interface GraphForceSettings {
  /** 연결된 노드 사이 목표 거리 */
  linkDistance: number;
  /** 링크가 노드를 끌어당기는 강도 (0~1) */
  linkStrength: number;
  /** 노드 간 반발력 (양수, 클수록 더 멀리 밀어냄) */
  repelStrength: number;
  /** 중심으로 끌어당기는 중력 (0~1) */
  centerGravity: number;
}

export const DEFAULT_FORCE_SETTINGS: GraphForceSettings = {
  linkDistance: 88,
  linkStrength: 0.24,
  repelStrength: 460,
  centerGravity: 0.05,
};

export type GraphLabelMode = "auto" | "always" | "hidden";

interface GraphStore {
  nodes: GraphLinkNode[];
  edges: GraphLinkEdge[];
  localDepth: number;
  focusedNoteId: string | null;
  isLocalMode: boolean;

  // ── Obsidian-style 인터랙션 상태 ──────────────────────────────
  /** 검색어 — 매칭 노드는 강조, 나머지는 흐려진다 */
  searchQuery: string;
  /** 고아 노드(연결 없는 노드) 표시 여부 */
  showOrphans: boolean;
  /** 화살표(방향) 표시 여부 */
  showArrows: boolean;
  /** 라벨 표시 모드 */
  labelMode: GraphLabelMode;
  /** 시뮬레이션 힘 설정 */
  forces: GraphForceSettings;
  /** 클릭으로 고정한 노드 — 이웃을 지속 강조한다 */
  pinnedNoteId: string | null;

  setGraphData: (nodes: GraphLinkNode[], edges: GraphLinkEdge[]) => void;
  setLocalDepth: (depth: number) => void;
  setFocusedNote: (noteId: string | null) => void;
  setLocalMode: (isLocalMode: boolean) => void;

  setSearchQuery: (query: string) => void;
  setShowOrphans: (show: boolean) => void;
  setShowArrows: (show: boolean) => void;
  setLabelMode: (mode: GraphLabelMode) => void;
  setForce: <K extends keyof GraphForceSettings>(
    key: K,
    value: GraphForceSettings[K]
  ) => void;
  resetForces: () => void;
  setPinnedNote: (noteId: string | null) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  localDepth: 2,
  focusedNoteId: null,
  isLocalMode: false,

  searchQuery: "",
  showOrphans: true,
  showArrows: false,
  labelMode: "auto",
  forces: { ...DEFAULT_FORCE_SETTINGS },
  pinnedNoteId: null,

  setGraphData: (nodes, edges) => set({ nodes, edges }),
  setLocalDepth: (localDepth) => set({ localDepth }),
  setFocusedNote: (focusedNoteId) => set({ focusedNoteId }),
  setLocalMode: (isLocalMode) => set({ isLocalMode }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowOrphans: (showOrphans) => set({ showOrphans }),
  setShowArrows: (showArrows) => set({ showArrows }),
  setLabelMode: (labelMode) => set({ labelMode }),
  setForce: (key, value) =>
    set((state) => ({ forces: { ...state.forces, [key]: value } })),
  resetForces: () => set({ forces: { ...DEFAULT_FORCE_SETTINGS } }),
  setPinnedNote: (pinnedNoteId) => set({ pinnedNoteId }),
}));
