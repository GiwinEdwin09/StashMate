"use client";

import Collection from "../components/collections";
import Inventory from "../components/InventoryItem";
import RevenueGraph from "../components/RevenueGraph";

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
  return (
    <div
      className="flex"
      style={{
        paddingTop: "80px", // match navbar height
        height: "calc(100vh - 80px)",
      }}
    >
      {/* Left sidebar: Collections */}
      <Collection onSelectCollection={setSelectedCollectionId} />

      {/* Right side: inventory + chart */}
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
