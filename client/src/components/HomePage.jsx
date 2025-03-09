// src/components/HomePage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import GalleryCarousel from './GalleryCarousel';
import './HomePage.css';
import droplet from "../assets/aboutcsp.png";
import contact from "../assets/blacsp.jpg";
import g1 from "../assets/g1.jpg";
import g2 from "../assets/g2.jpg";
import g3 from "../assets/g3.jpg";
import g4 from "../assets/g4.jpg";
import g5 from "../assets/g5.jpg";
import g6 from "../assets/g6.jpg";

const HomePage = () => {
  const [aboutVisible, setAboutVisible] = useState(false);

  const toggleAbout = () => {
    setAboutVisible(!aboutVisible);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Email sent (dummy function)');
  };

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section id="hero" className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1>Aqua Alert</h1>
            <h2>
              A Comprehensive Water Reporting System<br /> for My Village
            </h2>
            <br />
            <button
              className="hero-button"
              onClick={() => {
                window.location.href = '/login';
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-droplet" onClick={toggleAbout}>
            <motion.img
              src={droplet}
              alt="Water Droplet"
              className="droplet-image"
              whileHover={{ scale: 1.1 }}
            />
          </div>
          <AnimatePresence>
            {aboutVisible && (
              <motion.div
                className="about-content"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.5 }}
              >
                <h2>About Our Water Project</h2>
                <div className="about-text">
                  <p>
                    Embracing the fluidity of water and innovation, our project transforms experiences
                    with refreshing design and dynamic technology.
                  </p>
                  <p>
                    Click the button below to download our detailed PDF and learn more about our journey.
                  </p>
                </div>
                <div className="about-button-container">
                  <button onClick={() => window.open('https://example.com/about.pdf', '_blank')}>
                    Download PDF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="gallery-section">
        <h2>How the facilities are in Venigandla Village</h2>
        <div className="gallery-carousel-wrapper">
          <GalleryCarousel images={[g1, g2, g3, g4, g5, g6]} interval={3000} />
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <div className="contact-details">
            <h2>Contact Us</h2>
            <form onSubmit={handleContactSubmit} className="contact-form">
              <input type="text" name="name" placeholder="Your Name" required />
              <input type="email" name="email" placeholder="Your Email" required />
              <textarea name="message" placeholder="Your Message" required></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
          <div className="contact-image">
            <img src={contact} alt="Contact" />
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
