import React, { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  logout: () => void;
  handleBack: () => void;
  isCollectionSelected: boolean;
  exportButton?: React.ReactNode;
  onExport?: () => void | Promise<void>;
}

const Navbar: React.FC<NavbarProps> = ({ 
  logout, 
  handleBack, 
  isCollectionSelected,
  exportButton 
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const closeDropdown = () => setDropdownOpen(false);
  const openDropdown = () => setDropdownOpen(true);

  return (
    <header className="navbar-container">
      <div className="navbar-logo">
        <Link href="/">StashMate</Link>
      </div>

      <div className="navbar-actions">
        {exportButton}
        
        {isCollectionSelected && (
          <button className="navbar-add-item-btn">+ Add Item</button>
        )}

        <div
          className="navbar-dropdown"
          onMouseEnter={openDropdown}
          onMouseLeave={closeDropdown}
        >
          <button className="navbar-dropdown-btn">
            <span className="navbar-dropdown-icon">▼</span>
          </button>
          {dropdownOpen && (
            <div className="navbar-dropdown-content">
              {isCollectionSelected && (
                <button className="navbar-dropdown-item" onClick={handleBack}>
                  Back to Collections
                </button>
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
  );
};

export default Navbar;