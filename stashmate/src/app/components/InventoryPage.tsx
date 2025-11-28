"use client";

import Collection from "../components/collections";
import Inventory from "../components/InventoryItem";
import RevenueGraph from "../components/RevenueGraph";
import { getCollectionOwner } from '../actions/collections/getSharedCollectionOwner'

import { useState, useEffect } from "react";

export default function InventoryPage({
  onBack,
  refreshRevenue,
  revenueData,
  selectedCollectionId,
  setSelectedCollectionId,
}: {
  onBack: () => void;
  refreshRevenue: () => void;
  revenueData: any[];
  selectedCollectionId: number | null;
  setSelectedCollectionId: (id: number | null) => void;
}) {
  const [currentPermission, setCurrentPermission] = useState<string | undefined>('owner');
  const [ownerName, setOwnerName] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchOwnerInfo() {
      if (!selectedCollectionId) {
        setOwnerName(undefined);
        return;
      }

      const result = await getCollectionOwner(selectedCollectionId);
      
      if (result.data?.owner_name) {
        setOwnerName(result.data.owner_name);
      } else {
        setOwnerName(undefined);
      }
    }

    fetchOwnerInfo();
  }, [selectedCollectionId]);

  return (
    <div
      className="flex"
      style={{
        paddingTop: "80px",
        height: "calc(100vh - 80px)",
      }}
    >
      <Collection onSelectCollection={(id, permission) => {
        setSelectedCollectionId(id);
        setCurrentPermission(permission);
      }} />

      <main
        style={{
          flex: 1,
          padding: "16px 24px",
          background: "linear-gradient(135deg, var(--bg-start), var(--bg-end))",
          overflowY: "auto",
        }}
      >
        {selectedCollectionId ? (
          <div className="grid" style={{ gap: "16px" }}>
            <div className="card">
              <Inventory
                collectionId={selectedCollectionId}
                onItemUpdate={refreshRevenue}
                permission={currentPermission}
                ownerName={ownerName}
              />
            </div>

            <div className="card">
              <h2 style={{ margin: 0, marginBottom: "8px", fontSize: "1rem" }}>
                Revenue overview
              </h2>
              <p className="muted" style={{ marginTop: 0, marginBottom: "12px" }}>
                Revenue for this collection over time.
              </p>
              <RevenueGraph data={revenueData} />
            </div>
          </div>
        ) : (
          <div
            className="card"
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p className="muted" style={{ fontSize: "0.95rem" }}>
              Select a collection on the left to view its inventory and revenue.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}