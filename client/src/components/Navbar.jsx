// src/components/Navbar.jsx
import React, { useState } from 'react';
import './Navbar.css';
import logo from "../assets/aboutcsp.png"

const Navbar = () => {
  const [menuActive, setMenuActive] = useState(false);

  const toggleMenu = () => setMenuActive(!menuActive);

  return (
    <nav className="navbar">
      <div className="navbar-logo"><img src={logo} alt="" /> <span>AA</span></div>

      {/* Hamburger Menu */}
      <div className={`hamburger ${menuActive ? 'active' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Navigation Links */}
      <ul className={`navbar-menu ${menuActive ? 'active' : ''}`}>
        <li><a href="#hero" onClick={() => setMenuActive(false)}>Home</a></li>
        <li><a href="#about" onClick={() => setMenuActive(false)}>About</a></li>
        <li><a href="#gallery" onClick={() => setMenuActive(false)}>Gallery</a></li>
        <li><a href="#contact" onClick={() => setMenuActive(false)}>Contact</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
