interface DatabaseUnavailableStateProps {
  detail?: string;
}

export function DatabaseUnavailableState({
  detail,
}: DatabaseUnavailableStateProps) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 bg-[var(--color-background)] px-6 text-center">
      <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
        Database unavailable
      </h1>
      <p className="max-w-[560px] text-[14px] text-[var(--color-text-secondary)]">
        Obnofi could not connect to the configured PostgreSQL database. Check
        `DATABASE_URL`, `DIRECT_URL`, and whether the Supabase database is
        reachable from this environment.
      </p>
      {detail ? (
        <p className="max-w-[640px] text-[12px] text-[var(--color-text-secondary)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
