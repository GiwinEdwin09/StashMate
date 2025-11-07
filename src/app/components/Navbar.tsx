import React, { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  logout: () => void;
  handleBack: () => void;
  isCollectionSelected: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ logout, handleBack, isCollectionSelected }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on mouse leave
  const closeDropdown = () => setDropdownOpen(false);
  const openDropdown = () => setDropdownOpen(true);

  return (
    <header className="navbar-container">
      {/* Logo Section */}
      <div className="navbar-logo">
        <Link href="/">StashMate</Link>
      </div>

      {/* Right-aligned buttons */}
      <div className="navbar-actions">
        {isCollectionSelected && (
          <>
            <button className="navbar-export-btn">Export CSV</button>
            <button className="navbar-add-item-btn">+ Add Item</button>
          </>
        )}

        {/* User Action Dropdown */}
        <div
          className="navbar-dropdown"
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
        >
          <button className="navbar-dropdown-btn">
            <span className="navbar-dropdown-icon">▼</span> {}
          </button>
          {dropdownOpen && (
            <div className="navbar-dropdown-content">
              <button className="navbar-dropdown-item" onClick={handleBack}>Back to Collections</button>
              <Link href="/profile" className="navbar-dropdown-item">Profile</Link>
              <button className="navbar-dropdown-item" onClick={logout}>Log Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
