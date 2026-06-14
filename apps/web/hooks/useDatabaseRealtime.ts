"use client";

import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useGroveCatalogStore } from "@/store/useGroveCatalogStore";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { PropertyValueData } from "@obnofi/types";

interface PropertyValueRealtimeRow extends Record<string, unknown> {
  id: string;
  pageId: string;
  propertyId: string;
  value: PropertyValueData;
}

export function useDatabaseRealtime(pageId: string, enabled: boolean) {
  const patchGroveCellValue = useGroveCatalogStore((state) => state.patchGroveCellValue);
  const localChangesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return;

    const supabase = createBrowserSupabaseClient();
    const channelName = `db-collab:${pageId}`;

    const channel = supabase.channel(channelName).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "PropertyValue",
        filter: `pageId=eq.${pageId}`,
      },
      (payload: RealtimePostgresChangesPayload<PropertyValueRealtimeRow>) => {
        if (payload.eventType === "DELETE") return;

        const record = payload.new;
        if (!record?.pageId || !record?.propertyId) return;

        const key = `${record.pageId}:${record.propertyId}`;
        if (localChangesRef.current.has(key)) {
          localChangesRef.current.delete(key);
          return;
        }

        // 다른 사용자의 변경 — 로컬 store 갱신 (낙관적 업데이트 없이)
        patchGroveCellValue(pageId, record.pageId, record.propertyId, record.value);
      }
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, pageId, patchGroveCellValue]);

  const markLocalChange = (rowId: string, propertyId: string) => {
    localChangesRef.current.add(`${rowId}:${propertyId}`);
  };

  return { markLocalChange };
}
