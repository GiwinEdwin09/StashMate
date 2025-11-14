"use client";

import React from "react";
import Navbar from "../components/Navbar";
import ThemeToggle from "../components/ThemeToggle";
import { createBrowserClient } from "@supabase/ssr";

const ProfilePage: React.FC = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const logout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const isCollectionSelected = false;

  return (
    <>
      {}
      <Navbar
        logout={logout}
        handleBack={handleBack}
        isCollectionSelected={isCollectionSelected}
        showCollectionsLink={true}
      />

      {}
      <div
        style={{
          paddingTop: "100px",     
          paddingInline: "2rem",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            borderRadius: "12px",
            border: "1px solid rgba(148, 163, 184, 0.4)",
            padding: "1.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Profile</h1>

          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Appearance
            </h2>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
              Choose how StashMate looks on this device.
            </p>
            <ThemeToggle />
          </section>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
