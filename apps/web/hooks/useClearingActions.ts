import type { Comment, Element, Room, User } from "@obnofi/types/clearing";
import { createEmbedElement } from "@/lib/embedUtils";
import { createImageElement, uploadImageToBoard } from "@/lib/imageUpload";
import { logClearingPersistenceError } from "@/lib/canvas/clearingBoardUtils";
import { buildElement } from "@/lib/canvas/clearingBoardElementBuilders";

type ActiveThreadTarget = { elementId: string | null; x: number; y: number } | null;

export type ClearingActionsOptions = {
  currentRoomRef: React.MutableRefObject<Room | null>;
  currentUserRef: React.MutableRefObject<User | null>;
  elements: Element[];
  isSupabaseLive: boolean;
  activeThreadTarget: ActiveThreadTarget;
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  setUploadingImage: React.Dispatch<React.SetStateAction<boolean>>;
  setEmbedDraftUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setTool: (tool: string) => void;
  addElement: (el: Element) => void;
  selectSingle: (id: string) => void;
  setSelectedElement: (id: string | null) => void;
  updateElement: (id: string, patch: Partial<Element>) => void;
  pushHistory: (snapshot?: Element[]) => void;
  persistElement: (el: Element) => Promise<void>;
  elementLookup: Record<string, Element>;
};

export function useClearingActions({
  currentRoomRef,
  currentUserRef,
  elements,
  isSupabaseLive,
  activeThreadTarget,
  setComments,
  setUploadingImage,
  setEmbedDraftUrl,
  setTool,
  addElement,
  selectSingle,
  setSelectedElement,
  updateElement,
  pushHistory,
  persistElement,
  elementLookup,
}: ClearingActionsOptions) {
  const handleCreateElement = async (kind: "sticky" | "connector" | "vine") => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser) return;
    pushHistory();
    const nextElement = buildElement(kind, activeRoom.id, activeUser.id, elements.length + 1, elements);
    addElement(nextElement);
    selectSingle(nextElement.id);
    setSelectedElement(nextElement.id);
    await persistElement(nextElement);
  };

  const handlePathCreated = async (element: Element) => {
    pushHistory();
    addElement(element);
    selectSingle(element.id);
    setSelectedElement(element.id);
    await persistElement(element);
  };

  const handleCreateComment = async () => { setTool("comment"); };

  const submitComment = async (content: string, parentId?: string | null) => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser || !activeThreadTarget) return;

    const nextComment: Comment = {
      id: crypto.randomUUID(),
      roomId: activeRoom.id,
      elementId: activeThreadTarget.elementId,
      authorId: activeUser.id,
      body: content,
      content,
      parentId: parentId ?? null,
      x: activeThreadTarget.elementId ? undefined : activeThreadTarget.x,
      y: activeThreadTarget.elementId ? undefined : activeThreadTarget.y,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolved: false,
    };

    setComments((c) => [...c, nextComment]);
    if (!isSupabaseLive) return;

    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase");
      const { assertSupabaseSuccess: assert } = await import("@/lib/canvas/clearingBoardUtils");
      const result = await createBrowserSupabaseClient().from("comments").insert({
        id: nextComment.id, room_id: nextComment.roomId, element_id: nextComment.elementId,
        author_id: nextComment.authorId, body: nextComment.body, content: nextComment.content,
        parent_id: nextComment.parentId, x: nextComment.x, y: nextComment.y,
        resolved: false, created_at: nextComment.createdAt, updated_at: nextComment.updatedAt,
      });
      assert(result, "comment insert failed");
    } catch (error) {
      logClearingPersistenceError("submitComment failed", error);
    }
  };

  const resolveThread = async (comments: Comment[]) => {
    if (!activeThreadTarget) return;
    const ids = comments
      .filter((c) => {
        if (c.elementId !== activeThreadTarget.elementId) return false;
        if (c.elementId) return true;
        return c.x === activeThreadTarget.x && c.y === activeThreadTarget.y;
      })
      .map((c) => c.id);
    setComments((c) => c.map((comment) =>
      ids.includes(comment.id) ? { ...comment, resolved: true, resolvedAt: new Date().toISOString() } : comment
    ));
    if (!isSupabaseLive || ids.length === 0) return;
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase");
      const { assertSupabaseSuccess: assert } = await import("@/lib/canvas/clearingBoardUtils");
      const result = await createBrowserSupabaseClient().from("comments")
        .update({ resolved: true, resolved_at: new Date().toISOString() }).in("id", ids);
      assert(result, "comment resolve failed");
    } catch (error) {
      logClearingPersistenceError("resolveThread failed", error);
    }
  };

  const handleImageUpload = async (file: File) => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser) return;
    setUploadingImage(true);
    try {
      let assetUrl = URL.createObjectURL(file);
      if (isSupabaseLive) {
        try { assetUrl = await uploadImageToBoard(file, activeRoom.id); }
        catch (error) { logClearingPersistenceError("uploadImageToBoard failed", error); }
      }
      const nextElement = await createImageElement({
        alt: file.name, createdBy: activeUser.id, file, roomId: activeRoom.id,
        url: assetUrl, x: 980, y: 440, zIndex: elements.length + 1,
      });
      pushHistory();
      addElement(nextElement);
      selectSingle(nextElement.id);
      setSelectedElement(nextElement.id);
      await persistElement(nextElement);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEmbedCreate = async (url: string) => {
    const activeRoom = currentRoomRef.current;
    const activeUser = currentUserRef.current;
    if (!activeRoom || !activeUser) return;
    const nextElement = createEmbedElement({
      createdBy: activeUser.id, roomId: activeRoom.id, url, x: 960, y: 420, zIndex: elements.length + 1,
    });
    if (!nextElement) return;
    pushHistory();
    addElement(nextElement);
    selectSingle(nextElement.id);
    setSelectedElement(nextElement.id);
    await persistElement(nextElement);
    setEmbedDraftUrl(null);
  };

  const handleVote = (elementId: string) => {
    const activeUser = currentUserRef.current;
    const target = elementLookup[elementId];
    if (!activeUser || !target || (target.type !== "sticky" && target.type !== "shape")) return;
    const currentVotes = target.content.votes ?? {};
    const nextVotes = Math.min(3, (currentVotes[activeUser.id] ?? 0) + 1);
    updateElement(elementId, {
      content: { ...target.content, votes: { ...currentVotes, [activeUser.id]: nextVotes } },
      updatedAt: new Date().toISOString(),
    });
  };

  return {
    handleCreateElement,
    handlePathCreated,
    handleCreateComment,
    submitComment,
    resolveThread,
    handleImageUpload,
    handleEmbedCreate,
    handleVote,
  };
}
