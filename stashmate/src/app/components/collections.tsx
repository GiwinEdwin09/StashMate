"use client";

import { useState, useEffect } from "react";
import { createCollection } from "../actions/collections/createCollection";
import { getCollections } from "../actions/collections/getCollection";
import { deleteCollection } from "../actions/collections/deleteCollection";
import { createItem } from "../actions/items/createItem";
import { exportCollectionsWithItems } from "../actions/Export-Import/export";
import ImportButton from "./importButton";
import ShareModal from "./ShareModal";
import RenameCollectionModal from "./renameCollection";

type Collection = {
  id: number;
  name: string;
  category: string;
  cond: string;
  qty: number;
  cost: number;
  value: number;
  source: number;
  acquired_date: string;
  status: number;
  profit: number;
  owner_id: string;
  permission?: string;
  is_owner?: boolean;
  owner_name?: string;
};

export default function AddCollectionForm({
  onSelectCollection,
}: {
  onSelectCollection: (id: number, permission?: string) => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showOverlay, setShowOverlay] = useState(false);

  const [exportOverlay, setExportOverlay] = useState(false);
  const [selectedExport, setSelectExprt] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCollectionForShare, setSelectedCollectionForShare] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedCollectionForRename, setSelectedCollectionForRename] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [newItem, setNewItem] = useState({
    name: "",
    condition: "",
    cost: 0,
    price: 0,
    profit: 0,
    source: "",
    collectionId: 0,
  });

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentSelection, setCurrentSelection] = useState<number | null>(null);

  const fetchCollections = async () => {
    setIsLoading(true);
    const result = await getCollections();

    if (result.error) {
      console.error("Error fetching collection:", result.error);
      setError("Error fetching collection");
    } else if (result.data) {
      setCollections(result.data);
    }

    setIsLoading(false);
  };
  
  const handleRenameSuccess = async () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
    await fetchCollections();
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    const result = await createCollection(formData);

    if (result.success) {
      setSuccess(true);
      setShowOverlay(false);
      setTimeout(() => setSuccess(false), 4000);
      form.reset();
      await fetchCollections();
    } else {
      setError(result.error || "Failed to create collection");
    }

    setIsLoading(false);
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this collection?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    const result = await deleteCollection(id);

    if (result.success) {
      // If deleting the currently selected collection, clear selection
      if (currentSelection === id) {
        setCurrentSelection(null);
      }
      await fetchCollections();
    } else {
      setError(result.error || "Failed to delete collection");
    }

    setDeletingId(null);
  }

  const handleCollectionClick = (id: number, permission?: string) => {
    setCurrentSelection(id);
    onSelectCollection(id, permission);
  };

  const specificExprtClick = (
    e: React.MouseEvent,
    collectionId: number
  ) => {
    e.stopPropagation();

    const idStr = collectionId.toString();
    setSelectExprt((curr) => {
      const alreadySelected = curr.includes(idStr);
      if (alreadySelected) {
        return curr.filter((id) => id !== idStr);
      } else {
        return [...curr, idStr];
      }
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError("");

    try {
      const ids = selectedExport.length > 0 ? selectedExport : undefined;
      const result = await exportCollectionsWithItems(ids);

      if (!result.csv) {
        setError(result.error || "Export failed");
        return;
      }

      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `collections-items-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSelectExprt([]);
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export collections");
    } finally {
      setIsExporting(false);
    }
  };

  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [name]: value,
    }));
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newItem.name && newItem.condition && newItem.cost && newItem.price) {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("condition", newItem.condition);
      formData.append("cost", newItem.cost.toString());
      formData.append("price", newItem.price.toString());
      formData.append("profit", newItem.profit.toString());
      formData.append("source", newItem.source);
      formData.append("collectionId", newItem.collectionId.toString());

      const result = await createItem(formData);

      if (result.success) {
        setSuccess(true);
        setNewItem({
          name: "",
          condition: "",
          cost: 0,
          price: 0,
          profit: 0,
          source: "",
          collectionId: 0,
        });
        await fetchCollections();
      } else {
        setError(result.error || "Failed to add item");
      }
    }
  };

  return (
    <>
      {/* Collections Sidebar */}
      <aside className="flex flex-col h-[calc(100vh-80px)] border-r border-[var(--border)] bg-[var(--panel)] w-80 min-w-[280px]">
        {/* Header / toolbar */}
        <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-[140px]">
              <h3 className="text-lg font-semibold">Collections</h3>
              <p className="muted" style={{ marginTop: "2px" }}>
                Create, organize, and export your sets.
              </p>
            </div>
            {/* Open Export Overlay*/}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <button
                onClick={() => setExportOverlay(true)}
                disabled={isExporting || collections.length === 0}
                className="btn"
                style={{
                  borderRadius: "999px",
                  paddingInline: "8px",
                  paddingBlock: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.8rem",
                  opacity:
                    collections.length === 0 ? 0.6 : 1,
                }}
                title={
                  selectedExport.length > 0
                    ? `Export ${selectedExport.length} selected`
                    : "Export all collections"
                }
              >
                <span>Export CSV</span>
              </button>

              {/* Export Overlay */}
              {exportOverlay && (
                <div
                  className="fixed inset-0 flex justify-center items-center bg-black/60 z-50"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setExportOverlay(false);
                  }}
                >
                  <div 
                    className="card w-[850px]"
                    style={{
                        width: "min(520px, 100% - 32px)",
                        padding: "24px 24px 20px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div 
                      className="space" 
                      style={{
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "1.1rem",
                          }}
                        >
                          Export Collections
                        </h2>
                        <p className="muted" style={{ marginTop: "4px" }}>
                          Select collections to export.
                        </p>
                      </div>
                    </div>
                    {/* List of collections to export*/}
                    <ul className="space-y-2 max-h-64 overflow-y-auto mb-6">
                      {collections.map((col) => {
                        const isSelected = selectedExport.includes(col.id.toString());
                        return (
                          <li
                            key={col.id}
                            className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[#111114] px-3 py-2 hover:border-[var(--brand)] hover:bg-[#15151b] transition-colors cursor-pointer"
                          >
                            {/* Checkboxes */}
                            <button
                              onClick={(e) => specificExprtClick(e, col.id)}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-500"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                            {/* Collections Info */}
                            <div className="flex-1">
                              <p className="font-medium text-white">{col.name}</p>
                              <p className="text-xs text-gray-400">
                                {col.category || "Uncategorized"}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="badge b-zinc text-[0.7rem] whitespace-nowrap">
                                {col.acquired_date
                                  ? new Date(
                                      col.acquired_date
                                    ).toLocaleDateString()
                                  : "No date"}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Export Overlay Buttons */}
                    <div
                      className="space"
                      style={{ marginTop: "18px", justifyContent: "flex-end" }}
                    >
                      <button
                        type="button"
                        onClick={() => setExportOverlay(false)}
                        className="btn"
                        style={{
                          borderRadius: "999px",
                          paddingInline: "14px",
                          fontSize: "0.85rem",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExport}
                        type="submit"
                        disabled={isLoading}
                        style={{
                          borderRadius: "999px",
                          paddingInline: "16px",
                          fontSize: "0.9rem",
                          opacity: isExporting ? 0.6 : 1,
                        }}
                        className="btn primary"
                      >
                        {isExporting
                          ? "Exporting..."
                          : selectedExport.length > 0
                          ? `Export (${selectedExport.length})`
                          : "Export CSV"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Import */}
              <ImportButton onImportComplete={fetchCollections} />

              {/* New collection */}
              <button
                onClick={() => setShowOverlay(true)}
                className="btn primary"
                style={{
                  borderRadius: "999px",
                  paddingInline: "8px",
                  paddingBlock: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.8rem",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#05220f",
                  }}
                >
                  +
                </span>
                <span>New</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-400 bg-red-900/30 border border-red-500/40 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Collections list */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-3 py-3">
            {isLoading ? (
              <div className="text-gray-400 text-sm">Loading collections…</div>
            ) : collections.length === 0 ? (
              <div className="text-gray-400 text-sm">
                No collections yet. Click{" "}
                <span className="font-semibold">New</span> to create your
                first one.
              </div>
            ) : (
              <ul className="space-y-2">
                {collections.map((col) => {
                  const isSelected = selectedExport.includes(
                    col.id.toString()
                  );
                  const isMenuOpen = openMenuId === col.id;
                  const isCurrentSelection = currentSelection === col.id;

                  return (
                    <li
                      key={col.id}
                      onClick={() => handleCollectionClick(col.id, col.permission)}
                      className="group flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors cursor-pointer"
                      style={{
                        borderColor: isCurrentSelection ? 'var(--brand)' : 'var(--border)',
                        backgroundColor: isCurrentSelection ? 'rgba(16, 185, 129, 0.15)' : '#111114',
                      }}
                    >

                      {/* Name + category */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {col.name}
                          </p>
                          {col.permission && col.permission !== 'owner' && (
                            <span className="badge b-blue text-[0.65rem] px-1.5 py-0.5">
                              {col.permission === 'view' ? 'View' : col.permission === 'edit' ? 'Edit' : col.permission}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {col.category || "Uncategorized"}
                          {col.permission && col.permission !== 'owner' && col.owner_name && (
                            <span className="text-gray-500"> • Shared by {col.owner_name}</span>
                          )}
                        </p>
                      </div>

                      {/* Meta: date + action menu */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="badge b-zinc text-[0.7rem] whitespace-nowrap">
                          {col.acquired_date
                            ? new Date(
                                col.acquired_date
                              ).toLocaleDateString()
                            : "No date"}
                        </span>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : col.id);
                            }}
                            className="btn"
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "999px",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              lineHeight: 1,
                            }}
                          >
                            ⋯
                          </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 mt-2 w-40 rounded-md border border-[var(--border)] bg-[#111114] shadow-lg z-20 text-sm overflow-hidden">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setSelectedCollectionForRename({
                                      id: col.id,
                                      name: col.name,
                                    });
                                    setShowRenameModal(true);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-[#15151b] text-gray-200"
                                >
                                  Rename
                                </button>
                              {col.is_owner !== false && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setSelectedCollectionForShare({
                                      id: col.id,
                                      name: col.name,
                                    });
                                    setShowShareModal(true);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-[#15151b] text-gray-200"
                                >
                                  Share
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  handleDelete(e, col.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-red-900/40 text-red-400 border-t border-[var(--border)]"
                                disabled={deletingId === col.id}
                              >
                                {deletingId === col.id ? "Deleting…" : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Add Collection Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black/60 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOverlay(false);
            }
          }
        }
        >
          <div
            className="card"
            style={{
              width: "min(520px, 100% - 32px)",
              padding: "24px 24px 20px",
            }}
          >
            <div className="space" style={{ marginBottom: "16px" }}>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                  }}
                >
                  New collection
                </h2>
                <p className="muted" style={{ marginTop: "4px" }}>
                  Name and categorize your new stash.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid" style={{ gap: "12px" }}>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1"
                    style={{ marginBottom: "4px" }}
                  >
                    Collection name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    required
                    disabled={isLoading}
                    className="w-full"
                    placeholder="e.g., Pokémon Base Set"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium mb-1"
                    style={{ marginBottom: "4px" }}
                  >
                    Category *
                  </label>
                  <input
                    id="category"
                    type="text"
                    name="category"
                    required
                    disabled={isLoading}
                    className="w-full"
                    placeholder="e.g., Cards, Figures, Comics…"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-3 text-sm text-red-400 bg-red-900/30 border border-red-500/40 rounded px-3 py-2">
                  {error}
                </div>
              )}

              <div
                className="space"
                style={{ marginTop: "18px", justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() => setShowOverlay(false)}
                  className="btn"
                  style={{
                    borderRadius: "999px",
                    paddingInline: "14px",
                    fontSize: "0.85rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn primary"
                  style={{
                    borderRadius: "999px",
                    paddingInline: "16px",
                    fontSize: "0.9rem",
                  }}
                >
                  {isLoading ? "Creating…" : "Create collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed bottom-6 right-10 bg-green-600 text-white rounded-md text-sm px-5 py-3 shadow-lg w-fit flex items-center gap-3">
          <span>Collection created successfully!</span>
          <button
            onClick={() => setSuccess(false)}
            className="flex items-center justify-center text-gray-200 hover:text-gray-300 leading-none w-2 h-2 translate-y-[-2px]"
            style={{ fontSize: "25px", lineHeight: 1, padding: 0, margin: 0 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedCollectionForShare && (
        <ShareModal
          collectionId={selectedCollectionForShare.id}
          collectionName={selectedCollectionForShare.name}
          onClose={() => {
            setShowShareModal(false);
            setSelectedCollectionForShare(null);
          }}
        />
      )}
      <RenameCollectionModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setSelectedCollectionForRename(null);
        }}
        collection={selectedCollectionForRename}
        onRenameSuccess={handleRenameSuccess}
      />
    </>
  );
}