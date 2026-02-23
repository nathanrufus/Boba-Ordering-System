import { useEffect, useState } from "react";

export default function ItemOptionGroupsModal({ open, item, optionGroups, onClose, onSaved, onSubmit }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    // If your backend returns existing mappings, prefill here.
    // Without a GET mapping endpoint, start empty.
    setSelected([]);
  }, [open]);

  if (!open || !item) return null;

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    setErr("");
    try {
      await onSubmit(item.id, selected);
      onSaved?.();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center">
        <div className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl p-6">
          <h3 className="text-xl font-extrabold">Map Option Groups</h3>
          <p className="text-slate-600 mt-1">
            Item: <b>{item.name}</b> — this replaces existing mapping.
          </p>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              {err}
            </div>
          ) : null}

          <div className="mt-5 space-y-2 max-h-[50vh] overflow-auto">
            {optionGroups.map((g) => (
              <label key={g.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <input
                  type="checkbox"
                  checked={selected.includes(g.id)}
                  onChange={() => toggle(g.id)}
                />
                <div>
                  <p className="font-extrabold">{g.name}</p>
                  <p className="text-sm text-slate-600">
                    {g.selectionType} • {g.isRequired ? "Required" : "Optional"}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-base font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-base font-extrabold hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Mapping"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}