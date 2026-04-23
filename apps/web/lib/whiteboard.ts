import type { Comment, Element, Room, User } from "@obnofi/types/clearing";

const SAMPLE_NAMES = ["Mina", "Theo", "Iris", "Jun", "Luca"];
const SAMPLE_COLORS = ["fern", "sun", "rose", "sky"] as const;

export function createDemoUser(): User {
  const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
  const color = SAMPLE_COLORS[Math.floor(Math.random() * SAMPLE_COLORS.length)];
  return {
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase()}@obnofi.local`,
    avatarUrl: null,
    color,
    connectedAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };
}

export function createDemoRoom(ownerId: string): Room {
  return {
    id: "c9fd4b0b-2ca7-4410-b0f4-94d4d4470ed8",
    name: "Jungle Clearing",
    slug: "jungle-clearing",
    ownerId,
    background: "paper",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDemoElements(roomId: string, userId: string): Element[] {
  const now = new Date().toISOString();
  return [
    {
      id: "e313be67-c195-422c-95f5-7997c01f6a6b",
      roomId,
      type: "sticky",
      x: 260,
      y: 180,
      width: 250,
      height: 210,
      rotation: -2,
      zIndex: 1,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: "sun",
        opacity: 1,
      },
      content: {
        kind: "sticky",
        text: "Kickoff goals\nClarify scope\nMap collaborators",
        tone: "sun",
      },
    },
    {
      id: "a70b4f35-ef64-4ae3-af3e-8f56ff9c5089",
      roomId,
      type: "shape",
      x: 640,
      y: 220,
      width: 280,
      height: 180,
      rotation: 0,
      zIndex: 2,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: "fern",
        strokeWidth: 2,
        opacity: 1,
      },
      content: {
        kind: "shape",
        shape: "rectangle",
        fill: "mist",
        label: "Research cluster",
      },
    },
    {
      id: "1154d556-37e4-4d29-9307-6116533b62cc",
      roomId,
      type: "text",
      x: 1050,
      y: 260,
      width: 420,
      height: 84,
      rotation: 0,
      zIndex: 3,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: "ink",
        opacity: 1,
      },
      content: {
        kind: "text",
        text: "Turn fuzzy workshop notes into a clean decision map.",
        fontSize: 36,
        align: "left",
        weight: 600,
      },
    },
    {
      id: "8dcc4094-d4b3-4ca2-8c76-84e35f9778e1",
      roomId,
      type: "connector",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      zIndex: 4,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: "fern",
        strokeWidth: 3,
        opacity: 1,
      },
      content: {
        kind: "connector",
        start: { x: 510, y: 285 },
        end: { x: 1048, y: 302 },
        fromElementId: "e313be67-c195-422c-95f5-7997c01f6a6b",
        toElementId: "1154d556-37e4-4d29-9307-6116533b62cc",
        arrowStart: false,
        arrowEnd: true,
        lineStyle: "solid",
        label: "priority",
      },
    },
  ];
}

export function createDemoComment(roomId: string, elementId: string | null, authorId: string): Comment {
  return {
    id: "a7a726fd-f1bf-405b-8f59-bca5a5bda6ab",
    roomId,
    elementId,
    authorId,
    body: "Keep the opening cluster lightweight so facilitation stays fast.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
