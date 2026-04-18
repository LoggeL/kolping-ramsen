export function DraftBanner({ label = "Entwurf" }: { label?: string }) {
  return (
    <div
      role="status"
      className="mb-6 rounded-md border border-amber-400 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 flex items-center gap-2"
    >
      <span aria-hidden>📝</span>
      <strong>{label}</strong>
      <span className="text-amber-800">
        — nur für eingeloggte Redakteure sichtbar.
      </span>
    </div>
  );
}
