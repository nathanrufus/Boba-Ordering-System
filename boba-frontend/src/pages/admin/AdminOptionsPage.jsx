import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOptionGroups,
  createOptionGroup,
  updateOptionGroup,
  listOptions,
  createOption,
  updateOption,
} from "../../api/adminMenu";

export default function AdminOptionsPage() {
  const qc = useQueryClient();

  const groupsQ = useQuery({ queryKey: ["admin-option-groups"], queryFn: listOptionGroups });

  const groups = useMemo(() => {
    const d = groupsQ.data;
    return Array.isArray(d) ? d : d?.optionGroups || d?.groups || [];
  }, [groupsQ.data]);

  const [newGroup, setNewGroup] = useState({
    name: "",
    selectionType: "single",
    isRequired: true,
    sortOrder: "1",
  });

  const createGroupMut = useMutation({
    mutationFn: createOptionGroup,
    onSuccess: () => {
      setNewGroup({ name: "", selectionType: "single", isRequired: true, sortOrder: "1" });
      qc.invalidateQueries({ queryKey: ["admin-option-groups"] });
    },
  });

  const [activeGroupId, setActiveGroupId] = useState(null);

  const optionsQ = useQuery({
    queryKey: ["admin-options", activeGroupId],
    queryFn: () => listOptions(activeGroupId),
    enabled: !!activeGroupId,
  });

  const options = useMemo(() => {
    const d = optionsQ.data;
    return Array.isArray(d) ? d : d?.options || [];
  }, [optionsQ.data]);

  const [newOption, setNewOption] = useState({
    optionGroupId: "",
    label: "",
    priceDelta: "0.00",
    sortOrder: "1",
  });

  const createOptionMut = useMutation({
    mutationFn: createOption,
    onSuccess: () => {
      setNewOption((p) => ({ ...p, label: "", priceDelta: "0.00", sortOrder: "1" }));
      qc.invalidateQueries({ queryKey: ["admin-options", activeGroupId] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6">
        <h2 className="text-xl font-extrabold">Option Groups</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-12">
          <input
            className="md:col-span-5 rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
            placeholder="Group name (e.g., Size)"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
          />
          <select
            className="md:col-span-3 rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
            value={newGroup.selectionType}
            onChange={(e) => setNewGroup({ ...newGroup, selectionType: e.target.value })}
          >
            <option value="single">single</option>
            <option value="multi">multi</option>
          </select>
          <select
            className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
            value={String(newGroup.isRequired)}
            onChange={(e) => setNewGroup({ ...newGroup, isRequired: e.target.value === "true" })}
          >
            <option value="true">Required</option>
            <option value="false">Optional</option>
          </select>
          <button
            className="md:col-span-2 rounded-xl bg-slate-900 text-white py-3 text-base font-extrabold hover:bg-slate-800 disabled:opacity-50"
            disabled={!newGroup.name.trim() || createGroupMut.isPending}
            onClick={() =>
              createGroupMut.mutate({
                name: newGroup.name.trim(),
                selectionType: newGroup.selectionType,
                isRequired: newGroup.isRequired,
                sortOrder: Number(newGroup.sortOrder),
              })
            }
          >
            Create
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setActiveGroupId(g.id);
                setNewOption((p) => ({ ...p, optionGroupId: String(g.id) }));
              }}
              className={`rounded-2xl border p-4 text-left ${
                activeGroupId === g.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className="font-extrabold">{g.name}</p>
              <p className="text-sm text-slate-600">
                {g.selectionType} • {g.isRequired ? "Required" : "Optional"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-6">
        <h2 className="text-xl font-extrabold">Options</h2>
        {!activeGroupId ? (
          <p className="text-slate-600 mt-2">Select an option group to manage its options.</p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-12">
              <input
                className="md:col-span-5 rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                placeholder="Label (e.g., Large)"
                value={newOption.label}
                onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
              />
              <input
                className="md:col-span-3 rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                placeholder='Price delta (e.g., "30.00")'
                value={newOption.priceDelta}
                onChange={(e) => setNewOption({ ...newOption, priceDelta: e.target.value })}
              />
              <input
                className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-4 focus:ring-slate-200 outline-none"
                placeholder="Sort"
                value={newOption.sortOrder}
                onChange={(e) => setNewOption({ ...newOption, sortOrder: e.target.value })}
              />
              <button
                className="md:col-span-2 rounded-xl bg-slate-900 text-white py-3 text-base font-extrabold hover:bg-slate-800 disabled:opacity-50"
                disabled={!newOption.label.trim() || createOptionMut.isPending}
                onClick={() =>
                  createOptionMut.mutate({
                    optionGroupId: Number(newOption.optionGroupId),
                    label: newOption.label.trim(),
                    priceDelta: newOption.priceDelta.trim(),
                    sortOrder: Number(newOption.sortOrder),
                  })
                }
              >
                Add
              </button>
            </div>

            {optionsQ.isLoading ? <p className="mt-4 text-slate-600">Loading options…</p> : null}
            <div className="mt-4 space-y-3">
              {options.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-200 p-4 bg-white">
                  <p className="font-extrabold">{o.label}</p>
                  <p className="text-sm text-slate-600">+ {o.priceDelta}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}