"use client";

import { useState } from "react";
import { renameCollection } from "../actions/collections/renameCollection";

type RenameCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  collection: {
    id: number;
    name: string;
  } | null;
  onRenameSuccess: () => void;
};

export default function RenameCollectionModal({
  isOpen,
  onClose,
  collection,
  onRenameSuccess,
}: RenameCollectionModalProps) {
  const [newName, setNewName] = useState(collection?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  useState(() => {
    if (collection) {
      setNewName(collection.name);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collection || !newName.trim()) {
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("id", collection.id.toString());
    formData.append("name", newName.trim());

    const result = await renameCollection(formData);

    if (result.success) {
      onRenameSuccess();
      handleClose();
    } else {
      setError(result.error || "Failed to rename collection");
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setNewName("");
    setError("");
    onClose();
  };

  if (!isOpen || !collection) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center bg-black/60 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="card"
        style={{
          width: "min(420px, 100% - 32px)",
          padding: "24px 24px 20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Rename Collection</h2>
          <p className="muted" style={{ marginTop: "4px" }}>
            Enter a new name for "{collection.name}"
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="newName" className="block text-sm font-medium mb-2">
              New Name
            </label>
            <input
              id="newName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[#111114] text-white focus:border-[var(--brand)] focus:outline-none"
              placeholder="Enter new collection name"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-400 bg-red-900/30 border border-red-500/40 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div
            className="space"
            style={{ marginTop: "18px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={handleClose}
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
              disabled={isLoading || !newName.trim()}
              style={{
                borderRadius: "999px",
                paddingInline: "16px",
                fontSize: "0.9rem",
                opacity: isLoading || !newName.trim() ? 0.6 : 1,
              }}
              className="btn primary"
            >
              {isLoading ? "Renaming..." : "Rename"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}