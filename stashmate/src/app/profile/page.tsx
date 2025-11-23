"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ThemeToggle from "../components/ThemeToggle";
import { createBrowserClient } from "@supabase/ssr";
import md5 from "blueimp-md5";

const ProfilePage: React.FC = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://www.gravatar.com/avatar/?d=mp&s=128"
  );

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.trim().toLowerCase() ?? null;
      setUserEmail(email);

      if (email) {
        const hash = md5(email);
        const url = `https://www.gravatar.com/avatar/${hash}?s=160&d=identicon`;
        setAvatarUrl(url);
      }
    };

    fetchUser();
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <>
      <Navbar
        logout={logout}
        handleBack={handleBack}
        isCollectionSelected={false}
        showCollectionsLink={true}
      />

      <main style={{ paddingTop: "96px" }}>
        <div className="wrap">
          {/* Page title */}
          <div style={{ marginBottom: "16px" }}>
            <h1 style={{ fontSize: "1.6rem", margin: 0 }}>Profile</h1>
            <p className="muted" style={{ marginTop: "4px" }}>
              Manage your account details and how StashMate looks on this
              device.
            </p>
          </div>

          {/* Account card */}
          <section
            className="card"
            style={{
              padding: "24px 28px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {/* Avatar column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  style={{
                    width: "96px",
                    height: "96px",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    border: "3px solid #22c55e",
                  }}
                />
                {userEmail && (
                  <span
                    className="muted"
                    style={{
                      fontSize: "0.8rem",
                      wordBreak: "break-all",
                    }}
                  >
                    Signed in as <strong>{userEmail}</strong>
                  </span>
                )}
              </div>

              {/* Text column */}
              <div style={{ flex: 1, minWidth: "260px" }}>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    margin: 0,
                    marginBottom: "8px",
                  }}
                >
                  Account
                </h2>
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "12px",
                    fontSize: "0.95rem",
                  }}
                >
                  StashMate uses your Gravatar based on your account email to
                  display your profile picture across the app.
                </p>
                <p
                  className="muted"
                  style={{ marginTop: 0, marginBottom: "16px" }}
                >
                  To change your picture, update your avatar on{" "}
                  <a
                    href="https://gravatar.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#22c55e", textDecoration: "underline" }}
                  >
                    gravatar.com
                  </a>{" "}
                  using the same email, then refresh this page.
                </p>

                <button
                  type="button"
                  className="btn"
                  style={{
                    borderRadius: "999px",
                    padding: "8px 16px",
                    marginTop: "4px",
                  }}
                  onClick={logout}
                >
                  Log out of this device
                </button>
              </div>
            </div>
          </section>

          {/* Preferences card */}
          <section
            className="card"
            style={{
              padding: "24px 28px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "24px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1, minWidth: "220px" }}>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    margin: 0,
                    marginBottom: "8px",
                  }}
                >
                  Appearance
                </h2>
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "4px",
                    fontSize: "0.95rem",
                  }}
                >
                  Choose how StashMate looks on this device.
                </p>
                <p className="muted" style={{ marginTop: 0 }}>
                  Theme is stored locally, so you can use different modes on
                  different browsers or devices.
                </p>
              </div>

              <div style={{ minWidth: "180px", textAlign: "right" }}>
                <ThemeToggle />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default ProfilePage;
