import React, { useEffect, useState } from "react";
import { getCurrentUser } from "@aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Outfit from "./Outfit";
import Footer from "./Footer";
import "../login.css";
import "./Swipe.css";

const styles = {
  container: {
    margin: 0,
    padding: 0,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.6,
  },
  noiseOverlay: {
    position: "relative",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "url('/images/noise.png')",
    opacity: 0.2,
    zIndex: 2,
  },
  nav: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "1rem",
    gap: "2rem",
  },
  navLink: {
    textDecoration: "none",
    color: "#333",
  },
  mainContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  hero: {
    textAlign: "center",
    padding: "4rem 0",
  },
  h1: {
    fontWeight: "light-bold",
    marginBottom: "1rem",
    color: "white",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#666",
    marginBottom: "2rem",
  },
  button: {
    background: "#DB3B14",
    color: "white",
    padding: "0.8rem 2rem",
    border: "none",
    borderRadius: "40px",
    cursor: "pointer",
  },
  section: {
    padding: "4rem 0",
  },
  h2: {
    color: "#DB3B14",
    fontSize: "2.5rem",
    marginBottom: "2rem",
  },
  textLarge: {
    fontSize: "1.2rem",
    marginBottom: "1.5rem",
  },
  h3: {
    color: "#FFAF87",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
    margin: "2rem 0",
  },
  statsBox: {
    marginBottom: "2rem",
  },
  statsTitle: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
  },
  statsIcon: {
    background: "#333",
    color: "white",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  },
  image: {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "8px",
  },
  footer: {
    background: "#f5f5f5",
    padding: "2rem 0",
    textAlign: "center",
  },
  footerLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    marginBottom: "1rem",
  },
  footerLink: {
    color: "#666",
    textDecoration: "none",
  },
  headerContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    flexDirection: "row", 
    flexWrap: "wrap",
    gap: "1rem",
  },
  mainTitle: {
    color: "#DB3B14",
    fontStyle: "italic",
    fontSize: "5rem",
    transition: "font-size 0.3s ease",
  },
  outfitsTitle: {
    color: "#DB3B14",
    margin: 0,
    transition: "font-size 0.3s ease",
  },
  buttonWrapper: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
};

const Closet = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState(null);
  const [outfits, setOutfits] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Determine if mobile view
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setIsLoggedIn(user);
        setUserID(user.username);

        if (user.username) {
          await fetchOutfits(user.username);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    fetchUser();
  }, []);

  const fetchOutfits = async (userID) => {
    try {
      const response = await fetch(
        `https://swipebop-backend.online/swipebop/outfits/${userID}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const outfits = data.outfits.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setOutfits({outfits: outfits});
    } catch (error) {
      alert("Error removing outfit. Please try again later.");
    }
  };

  const removeOutfit = async (outfitId) => {
    try {
      const res = await fetch(
        "https://swipebop-backend.online/swipebop/outfits/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userID,
            outfit_id: outfitId,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        alert("Outfit removed successfully!");
        fetchOutfits(userID);
      } else {
        const error = await res.json();
        console.error(error);
      }
    } catch (error) {
      alert("Error removing outfit. Please try again later.");
    }
  };

  const clearCloset = async () => {
    try {
      const res = await fetch(
        "https://swipebop-backend.online/swipebop/outfits/delete_all",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userID,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        alert("Closet cleared successfully!");
        fetchOutfits(userID);
      } else {
        const error = await res.json();
        alert(`Failed to clear closet: ${error.error}`);
      }
    } catch (error) {
      alert("Error clearing closet. Please try again later.");
    }
  };

  return (
    <div
      style={{
        ...styles.container,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Navbar />
      <section style={{ 
        ...styles.hero, 
        flex: 1, 
        padding: isMobile ? "2rem 1rem" : "4rem 0" 
      }}>
        <h1
          style={{
            ...styles.mainTitle,
            fontSize: isMobile ? "3rem" : "5rem",
          }}
        >
          swipebop closet
        </h1>
        {isLoggedIn ? (
          <>
            <div
              style={{
                ...styles.headerContainer,
                flexDirection: isMobile ? "column" : "row",
                padding: isMobile ? "1rem" : "1rem 2rem",
              }}
            >
              <h1 style={{ 
                ...styles.outfitsTitle, 
                fontSize: isMobile ? "1.8rem" : "2.2rem" 
              }}>
                Outfits
              </h1>
              <button
                style={{
                  ...styles.button,
                  background:
                    outfits && outfits.outfits && outfits.outfits.length > 0
                      ? "#DB3B14"
                      : "#ccc",
                  cursor:
                    outfits && outfits.outfits && outfits.outfits.length > 0
                      ? "pointer"
                      : "not-allowed",
                  padding: isMobile ? "0.6rem 1.5rem" : "0.8rem 2rem",
                  width: isMobile ? "100%" : "auto",
                }}
                onClick={() => clearCloset()}
                disabled={
                  !outfits || !outfits.outfits || outfits.outfits.length === 0
                }
              >
                Clear Closet
              </button>
            </div>

            {outfits == null ? (
              <div className="loading-container">
                <p>Loading products...</p>
              </div>
            ) : (
              <>
                <Outfit outfits={outfits.outfits} onRemove={removeOutfit} />
              </>
            )}
          </>
        ) : (
          <>
            <h1 style={{ 
              ...styles.h1, 
              color: "#DB3B14",
              fontSize: isMobile ? "1.5rem" : "2rem",
              padding: isMobile ? "0 1rem" : 0
            }}>
              Login / Signup to View Liked Outfits.
            </h1>
            <br />
            <div style={styles.buttonWrapper}>
              <button
                style={{ 
                  ...styles.button, 
                  marginRight: isMobile ? "0" : "10px",
                  marginBottom: isMobile ? "10px" : "0",
                  width: isMobile ? "100%" : "auto",
                  maxWidth: isMobile ? "250px" : "none"
                }}
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button 
                style={{ 
                  ...styles.button,
                  width: isMobile ? "100%" : "auto",
                  maxWidth: isMobile ? "250px" : "none"
                }} 
                onClick={() => navigate("/signup")}
              >
                Signup
              </button>
            </div>
          </>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Closet;