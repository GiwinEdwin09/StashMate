"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import md5 from "blueimp-md5";

interface NavbarProps {
  logout: () => void;
  handleBack: () => void;
  isCollectionSelected: boolean;
  exportButton?: React.ReactNode;
  onExport?: () => void | Promise<void>;
  showCollectionsLink?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  logout,
  handleBack,
  isCollectionSelected,
  exportButton,
  onExport,
  showCollectionsLink = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://www.gravatar.com/avatar/?d=mp&s=40"
  );

  const closeDropdown = () => setDropdownOpen(false);
  const openDropdown = () => setDropdownOpen(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.trim().toLowerCase();

      if (!email) return;

      const hash = md5(email);
      const url = `https://www.gravatar.com/avatar/${hash}?s=40&d=identicon`;
      setAvatarUrl(url);
    };

    fetchUser();
  }, []);

  return (
    <nav className="navbar-root">
      <header className="navbar-container">
        <div className="navbar-logo">
          <Link href="/landing">StashMate</Link>
        </div>

        <div className="navbar-actions">
          
          {isCollectionSelected && (
            <button className="navbar-add-item-btn">+ Add Item</button>
          )}

          <div
            className="navbar-dropdown"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button className="navbar-dropdown-btn">
              <img src={avatarUrl} alt="Profile" className="navbar-avatar" />
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown-content">
                {isCollectionSelected && (
                  <button className="navbar-dropdown-item" onClick={handleBack}>
                    Back to Collections
                  </button>
                )}
                {showCollectionsLink && (
                  <Link href="/dashboard" className="navbar-dropdown-item">
                    Collections
                  </Link>
                )}
                <Link href="/profile" className="navbar-dropdown-item">
                  Profile
                </Link>
                <button className="navbar-dropdown-item" onClick={logout}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </nav>
  );
};

export default Navbar;
