import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { getCurrentUser } from "@aws-amplify/auth";
import "./Swipe.css";
import "../login.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Item from "./Item";

const styles = {
  button: {
    background: "#DB3B14",
    color: "white",
    padding: "0.8rem 2rem",
    border: "none",
    borderRadius: "40px",
    cursor: "pointer",
  },
};

const SwipeBop = () => {
  const [products, setProducts] = useState({
    accessories: [],
    pants: [],
    shirts: [],
    shoes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productIds, setProductIds] = useState([]);
  const cardRefs = useRef({});
  const startX = useRef({});
  const currentX = useRef({});
  const isSwiping = useRef({});
  const SWIPE_THRESHOLD = 100;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState(null);
  const [likedProducts, setLikedProducts] = useState([]);
  const [discardedProducts, setDiscardedProducts] = useState([]);
  const [likedModal, setLikedModal] = useState(false);
  const [discardedModal, setDiscardedModal] = useState(false);
  const [loginChecked, setLoginChecked] = useState(false);
  const navigate = useNavigate();
  const likedScrollRef = useRef(null);
  const discardedScrollRef = useRef(null);
  const [visited, setVisited] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setIsLoggedIn(user);
        setUserID(user.username);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setLoginChecked(true);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const el = likedScrollRef.current;
    if (!likedModal || !el) return;

    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [likedModal]);

  useEffect(() => {
    const el = discardedScrollRef.current;
    if (!discardedModal || !el) return;

    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [discardedModal]);

  useEffect(() => {
    if (!loginChecked) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const categories = ["accessories", "pants", "shirts", "shoes"];
        const fetchedProducts = {};

        for (const category of categories) {
          const queryParams = new URLSearchParams({
            lang: "en-US",
            currency: "USD",
            q: category,
            limit: isLoggedIn ? 50 : 100,
            minPrice: 25,
            maxPrice: 500,
            siteId: 1006,
            allowOutOfStockItems: "false",
            dept: "WOMENS",
          });

          const response = await fetch(
            `https://swipebop-backend.online/swipebop/search?${queryParams}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Client-Id": "Shopbop-UW-Team2-2024",
                "Client-Version": "1.0.0",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ${category} products`);
          }

          const data = await response.json();
          console.log(data.products);
          const ids = data.products.map((x) => x.product.productSin);
          setProductIds(ids);
          console.log("Fetched product IDs:", ids);

          const productArray = data.products.map((product) => {
            return {
              id: product.product.productSin,
              imageUrl:
                "https://m.media-amazon.com/images/G/01/Shopbop/p/" +
                product.product.colors[0].images[0].src,
              name: product.product.shortDescription,
              brand: product.product.designerName,
              price: product.product.retailPrice.price,
              url: "https://shopbop.com/" + product.product.productDetailUrl,
              category,
            };
          });

          fetchedProducts[category] = productArray;
        }

        setProducts(fetchedProducts);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isLoggedIn, loginChecked]);

  const fetchRecommendations = async (likedItems) => {
    if (!likedItems?.items || likedItems.items.length === 0) return;

    for (let i = 0; i < likedItems.items.length; i++) {
      try {
        const productId = likedItems.items[i].product_id;
        if (visited.includes(productId)) {
          continue;
        }
        setVisited((prev) => [...prev, productId]);
        console.log(productId);
        const queryParams = new URLSearchParams({
          productSin: productId,
        });
        console.log(queryParams.toString());
        const res = await fetch(
          `https://swipebop-backend.online/swipebop/outfits?${queryParams.toString()}`,
          {
            method: "GET",
          }
        );
        if (res.ok) {
          const data = await res.json();
          data.styleColorOutfits.forEach((color) => {
            if (color.outfits && color.outfits.length > 0) {
              color.outfits.forEach((outfit) => {
                if (outfit.styleColors && outfit.styleColors.length > 0) {
                  outfit.styleColors.forEach((styleColorItem) => {
                    if (
                      styleColorItem.product &&
                      styleColorItem.product.productSin !== productId &&
                      !productIds.includes(styleColorItem.product.productSin)
                    ) {
                      const outfitProduct = {
                        id: styleColorItem.product.productSin,
                        imageUrl:
                          "https://m.media-amazon.com/images/G/01/Shopbop/p/" +
                          styleColorItem.image.src,
                        name: styleColorItem.product.shortDescription,
                        brand: styleColorItem.product.designerName,
                        price: styleColorItem.product.retailPrice.price,
                        url:
                          "https://shopbop.com/" +
                          styleColorItem.product.productDetailUrl,
                      };
                      if (
                        styleColorItem.product.productCategory == "FOOTWEAR"
                      ) {
                        outfitProduct.category = "shoes";
                        setProducts((prevProducts) => ({
                          ...prevProducts,
                          shoes: [...prevProducts.shoes, outfitProduct],
                        }));
                        productIds.push(styleColorItem.product.productSin);
                        return;
                      }
                      if (
                        styleColorItem.image.modelFirstName == "Accessories"
                      ) {
                        outfitProduct.category = "accessories";
                        setProducts((prevProducts) => ({
                          ...prevProducts,
                          accessories: [
                            ...prevProducts.accessories,
                            outfitProduct,
                          ],
                        }));
                        productIds.push(styleColorItem.product.productSin);
                        return;
                      }

                      let desc =
                        styleColorItem.product.shortDescription.toLowerCase();
                      if (
                        desc.includes("pants") ||
                        desc.includes("jeans") ||
                        desc.includes("trousers") ||
                        desc.includes("leggings") ||
                        desc.includes("shorts") ||
                        desc.includes("skirt") ||
                        desc.includes("boxer")
                      ) {
                        outfitProduct.category = "pants";
                        setProducts((prevProducts) => ({
                          ...prevProducts,
                          pants: [...prevProducts.pants, outfitProduct],
                        }));
                        productIds.push(styleColorItem.product.productSin);
                        return;
                      }
                      outfitProduct.category = "shirts";
                      setProducts((prevProducts) => ({
                        ...prevProducts,
                        shirts: [...prevProducts.shirts, outfitProduct],
                      }));
                      productIds.push(styleColorItem.product.productSin);
                      return;
                    }
                  });
                }
              });
            }
          });
        } else {
          const err = await res.json();
          console.error("Failed to fetch outfit match:", err);
        }
      } catch (err) {
        console.error("Error in fetchOutfitMatch:", err);
      }
    }
  };

  const handleTouchStart = (e, id) => {
    startX.current[id] = e.touches[0].clientX;
    isSwiping.current[id] = true;
    cardRefs.current[id].style.transition = "";
  };

  const handleTouchMove = (e, id) => {
    if (!isSwiping.current[id]) return;

    const touchX = e.touches[0].clientX;
    const deltaX = touchX - startX.current[id];
    currentX.current[id] = deltaX;

    const limitedDelta = Math.min(Math.max(deltaX, -150), 150);

    cardRefs.current[
      id
    ].style.transform = `translateX(${limitedDelta}px) rotate(${
      limitedDelta * 0.05
    }deg)`;

    const card = cardRefs.current[id];
    if (deltaX > 0) {
      card.querySelector(".like-overlay").style.opacity = Math.min(
        deltaX / 100,
        0.8
      );
      card.querySelector(".dislike-overlay").style.opacity = 0;
    } else if (deltaX < 0) {
      card.querySelector(".dislike-overlay").style.opacity = Math.min(
        -deltaX / 100,
        0.8
      );
      card.querySelector(".like-overlay").style.opacity = 0;
    } else {
      card.querySelector(".like-overlay").style.opacity = 0;
      card.querySelector(".dislike-overlay").style.opacity = 0;
    }
  };

  useEffect(() => {
    if (!loginChecked) return;
    if (isLoggedIn) {
      fetchLikedProducts();
      fetchDiscardedProducts();
    }
  }, [loginChecked]);

  const handleTouchEnd = (e, id) => {
    if (!isSwiping.current[id]) return;

    const deltaX = currentX.current[id];
    const card = cardRefs.current[id];
    card.style.transition = "transform 0.3s ease";

    if (deltaX > SWIPE_THRESHOLD) {
      // Swiped right - like
      card.style.transform = "translateX(1000px) rotate(30deg)";
      console.log(`Liked product ${id}`);
      setTimeout(() => removeCard(id), 300);
    } else if (deltaX < -SWIPE_THRESHOLD) {
      // Swiped left - dislike
      card.style.transform = "translateX(-1000px) rotate(-30deg)";
      console.log(`Disliked product ${id}`);
      setTimeout(() => removeCard(id), 300);
    } else {
      // Return to center
      card.style.transform = "translateX(0) rotate(0)";
      card.querySelector(".like-overlay").style.opacity = 0;
      card.querySelector(".dislike-overlay").style.opacity = 0;
    }

    isSwiping.current[id] = false;
  };

  const removeCard = (id) => {
    setProducts((prevProducts) => {
      const updatedProducts = { ...prevProducts };

      // Find which category this product is from
      for (const category in updatedProducts) {
        const index = updatedProducts[category].findIndex(
          (product) => product.id === id
        );
        if (index !== -1) {
          updatedProducts[category] = [
            ...updatedProducts[category].slice(0, index),
            { ...updatedProducts[category][index], hidden: true },
            ...updatedProducts[category].slice(index + 1),
          ];
          break;
        }
      }

      return updatedProducts;
    });
  };

  const handleDislike = async (productId) => {
    const card = cardRefs.current[productId];
    if (!card) return;
    if (!isLoggedIn) {
      card.style.transition = "transform 0.3s ease";
      card.style.transform = "translateX(-1000px) rotate(-30deg)";
      setTimeout(() => removeCard(productId), 300);
    }
    const outfits = getSelectedProducts();
    const item = outfits.find((product) => product.id == productId);
    if (!item) {
      alert("Product not found, Please try again later");
      return;
    }
    if (
      discardedProducts.items.some(
        (discardedItem) => discardedItem.product_id === item.id
      )
    ) {
      card.style.transition = "transform 0.3s ease";
      card.style.transform = "translateX(-1000px) rotate(-30deg)";
      setTimeout(() => removeCard(productId), 300);
      return;
    }
    const product = {
      productSin: item.id,
      imageUrl: item.imageUrl,
      url: item.url,
      name: item.name,
      brand: item.brand,
      price: item.price,
      category: item.category,
    };

    try {
      const res = await fetch(
        "https://swipebop-backend.online/swipebop/discard/insert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userID,
            product: product,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        console.log("Discarded product:", result);
      } else {
        const error = await res.json();
        console.error("Error discarding product:", error);
      }
    } catch (error) {
      console.error("Error discarding product:", error);
    }
    fetchDiscardedProducts();
    card.style.transition = "transform 0.3s ease";
    card.style.transform = "translateX(-1000px) rotate(-30deg)";
    setTimeout(() => removeCard(productId), 300);
  };

  // const handleReset = (productId) => {
  //   const card = cardRefs.current[productId];
  //   if (!card) return;

  //   card.style.transition = "transform 0.3s ease";
  //   card.style.transform = "translateX(0) rotate(0)";
  //   card.querySelector(".like-overlay").style.opacity = 0;
  //   card.querySelector(".dislike-overlay").style.opacity = 0;
  // };

  const handleLike = async (productId) => {
    const card = cardRefs.current[productId];
    if (!card) return;
    if (!isLoggedIn) {
      card.style.transition = "transform 0.3s ease";
      card.style.transform = "translateX(1000px) rotate(30deg)";
      setTimeout(() => removeCard(productId), 300);
    }
    const outfits = getSelectedProducts();
    const item = outfits.find((product) => product.id == productId);
    if (!item) {
      alert("Product not found, Please try again later");
      return;
    }

    if (
      likedProducts.items.some((likedItem) => likedItem.product_id === item.id)
    ) {
      card.style.transition = "transform 0.3s ease";
      card.style.transform = "translateX(1000px) rotate(30deg)";
      setTimeout(() => removeCard(productId), 300);
      return;
    }

    const product = {
      productSin: item.id,
      imageUrl: item.imageUrl,
      url: item.url,
      name: item.name,
      brand: item.brand,
      price: item.price,
      category: item.category,
    };

    try {
      const res = await fetch(
        "https://swipebop-backend.online/swipebop/liked/insert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userID,
            product: product,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        console.log("Liked product:", result);
      } else {
        const error = await res.json();
        console.error("Error liking product:", error);
      }
    } catch (error) {
      console.error("Error liking product:", error);
    }

    fetchLikedProducts();
    card.style.transition = "transform 0.3s ease";
    card.style.transform = "translateX(1000px) rotate(30deg)";
    setTimeout(() => removeCard(productId), 300);
  };

  const handleSaveSwipe = (productId) => {
    const card = cardRefs.current[productId];
    if (!card) return;

    card.style.transition = "transform 0.3s ease";
    card.style.transform = "translateX(1000px) rotate(30deg)";
    setTimeout(() => removeCard(productId), 300);
  };

  const handleButtonAction = (action) => {
    // Get all product ids
    const visibleProductIds = [];
    Object.values(products).forEach((categoryProducts) => {
      categoryProducts.forEach((product) => {
        if (!product.hidden) visibleProductIds.push(product.id);
      });
    });

    visibleProductIds.forEach((id) => {
      switch (action) {
        case "dislike":
          handleDislike(id);
          break;
        case "reset":
          handleReset(id);
          break;
        case "like":
          handleLike(id);
          break;
        case "save":
          handleSaveSwipe(id);
          break;
        default:
          break;
      }
    });
  };

  const getSelectedProducts = () => {
    const selectedProducts = [];

    // Get one product from each category
    const categories = ["shirts", "accessories", "pants", "shoes"];
    categories.forEach((category) => {
      const visibleProducts = products[category].filter((p) => !p.hidden);
      if (visibleProducts.length > 0) {
        selectedProducts.push(visibleProducts[0]);
      }
    });

    return selectedProducts;
  };

  const fetchLikedProducts = async () => {
    try {
      const res = await fetch(
        `https://swipebop-backend.online/swipebop/liked/${userID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const result = await res.json();
        setLikedProducts(result);
        console.log("Liked products:", result); // use `result` directly
        if (result.items?.length > 0) {
          fetchRecommendations(result); // not from `likedProducts`, use `result`
        }
        
      } else {
        const error = await res.json();
        console.error("Error fetching liked products:", error);
        alert("Failed to fetch liked products");
      }
    } catch (error) {
      console.error("Error fetching liked products:", error);
      alert("Error fetching liked products. Please try again.");
    }
  };

  const fetchDiscardedProducts = async () => {
    try {
      const res = await fetch(
        `https://swipebop-backend.online/swipebop/discard/${userID}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const result = await res.json();
        console.log("Discarded products:", result);
        setDiscardedProducts(result);
      } else {
        const error = await res.json();
        console.error("Error fetching discarded products:", error);
        alert("Failed to fetch discarded products");
      }
    } catch (error) {
      console.error("Error fetching discarded products:", error);
      alert("Error fetching discarded products. Please try again.");
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !userID) return;

    fetchLikedProducts();
    fetchDiscardedProducts();
  }, [isLoggedIn, userID]);

  const removeFromLiked = async (productId) => {
    console.log(userID, productId);
    try {
      const res = await fetch(
        "https://swipebop-backend.online/swipebop/liked/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userID,
            product_id: productId,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        setLikedProducts((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.product.id !== productId),
        }));
        fetchLikedProducts();
      } else {
        const error = await res.json();
        console.error("Error removing from liked products:", error);
        alert("Failed to remove from liked products");
      }
    } catch (error) {
      console.error("Error removing from liked products:", error);
      alert("Error removing from liked products. Please try again.");
    }
  };

  const removeFromDiscard = async (productId) => {
    try {
      const res = await fetch(
        "https://swipebop-backend.online/swipebop/discard/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userID,
            product_id: productId,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        setDiscardedProducts((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.product.id !== productId),
        }));
        fetchDiscardedProducts();
      } else {
        const error = await res.json();
        console.error("Error removing from discarded products:", error);
        alert("Failed to remove from discarded products");
      }
    } catch (error) {
      console.error("Error removing from discarded products:", error);
      alert("Error removing from discarded products. Please try again.");
    }
  };

  const restoreItem = (product, productId, liked) => {
    const restoredProduct = { ...product, id: productId };

    setProducts((prevProducts) => {
      const updatedProducts = { ...prevProducts };
      console.log(updatedProducts);
      const category = restoredProduct.category;

      if (!updatedProducts[category]) return updatedProducts;

      updatedProducts[category] = [
        ...updatedProducts[category].filter((p) => p.id !== productId),
      ];

      updatedProducts[category] = [
        { ...restoredProduct, hidden: false },
        ...updatedProducts[category],
      ];

      return updatedProducts;
    });

    if (liked) {
      removeFromLiked(productId);
    } else {
      removeFromDiscard(productId);
    }
  };

  const handleSaveOutfit = async () => {
    if (!isLoggedIn) {
      alert("Please log in to save outfits.");
      return;
    }

    const outfits = getSelectedProducts();

    if (outfits.length === 0) {
      alert("No products selected");
      return;
    }

    try {
      const res = await fetch(
        "https://swipebop-backend.online/swipebop/outfits/insert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            outfit: outfits,
            user_id: userID,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        alert("Outfit saved successfully!");
        handleButtonAction("save");
      } else {
        const error = await res.json();
        alert(`Failed to save outfit: ${error.error}`);
        console.error(error);
      }
    } catch (error) {
      console.error("Error saving outfit:", error);
      alert("Error saving outfit. Please try again.");
    }
  };

  const handleDiscardOutfit = async () => {
    const products = getSelectedProducts();

    for (let i = 0; i < products.length; i++) {
      handleDislike(products[i].id);
    }
    return;
  };

  const clearLiked = async () => {
    try {
      const res = await fetch(
        "https://swipebop-backend.online//swipebop/liked/delete_all",
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
        console.log("Cleared liked products:", result);
        setLikedProducts({ items: [] });
      } else {
        const error = await res.json();
        console.error("Error clearing liked products:", error);
      }
    } catch (error) {
      console.error("Error clearing liked products:", error);
      alert("Error clearing liked products. Please try again.");
    }
  };

  const clearDisliked = async () => {
    try {
      const res = await fetch(
        "https://swipebop-backend.online//swipebop/discard/delete_all",
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
        console.log("Cleared discarded products:", result);
        setDiscardedProducts({ items: [] });
      } else {
        const error = await res.json();
        console.error("Error clearing discarded products:", error);
      }
    } catch (error) {
      console.error("Error clearing discarded products:", error);
      alert("Error clearing discarded products. Please try again.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="swipebop-container">
        {loading ? (
          <div className="loading-container">
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="error-message">Error: {error}</div>
        ) : (
          <div className="card-container">
            <div className="card-grid">
              {getSelectedProducts().map((product) => (
                <Item
                  key={product.id}
                  ref={(el) => (cardRefs.current[product.id] = el)}
                  className="product-card"
                  onTouchStart={(e) => handleTouchStart(e, product.id)}
                  onTouchMove={(e) => handleTouchMove(e, product.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, product.id)}
                  style={{ touchAction: "pan-y" }}
                  productId={product.id}
                  handleDislike={handleDislike}
                  handleLike={handleLike}
                  isLoggedIn={isLoggedIn}
                >
                  <div className="dislike-overlay"></div>
                  <div className="like-overlay"></div>

                  <div className="product-image">
                    <img
                      src={product.imageUrl || "/api/placeholder/400/320"}
                      alt={`${product.name} image`}
                    />
                  </div>

                  <div className="product-info">
                    <p className="brand">{product.brand || "Brand"}</p>
                    <h3 className="name">{product.name || "Product Name"}</h3>
                    <p className="price">{product.price || "$0.00"}</p>
                  </div>
                </Item>
              ))}
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button
            onClick={() => handleDiscardOutfit()}
            className="action-button dislike"
          >
            <span>✕</span>
          </button>

          <button
            onClick={() => handleSaveOutfit()}
            className="action-button save"
          >
            <span>→</span>
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px",
          }}
        >
          <button
            style={{
              backgroundColor: "transparent",
              color: "#DB3B14",
              border: "1px solid #DB3B14",
              borderRadius: "20px",
              padding: "5px 10px",
              fontSize: "0.8rem",
              cursor: "pointer",
              marginRight: "10px",
              flex: 1,
            }}
            onClick={() => {
              fetchDiscardedProducts();
              setDiscardedModal(true);
            }}
          >
            Discard Pile
          </button>
          <button
            style={{
              backgroundColor: "#DB3B14",
              color: "white",
              border: "none",
              borderRadius: "20px",
              padding: "5px 10px",
              fontSize: "0.8rem",
              cursor: "pointer",
              flex: 1,
            }}
            onClick={() => {
              fetchLikedProducts();
              setLikedModal(true);
            }}
          >
            Liked Wishlist
          </button>
        </div>
      </div>
      <Modal
        show={likedModal}
        onHide={() => setLikedModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Liked Items</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <button
            style={{
              backgroundColor:
                likedProducts &&
                likedProducts.items &&
                likedProducts.items.length > 0
                  ? "#DB3B14"
                  : "#ccc",
              color: "white",
              padding: "0.8rem 1.5rem",
              border: "none",
              borderRadius: "20px",
              cursor:
                likedProducts &&
                likedProducts.items &&
                likedProducts.items.length > 0
                  ? "pointer"
                  : "not-allowed",
              fontSize: "1rem",
              fontWeight: "bold",
              transition: "background-color 0.3s ease, transform 0.2s ease",
              boxShadow:
                likedProducts &&
                likedProducts.items &&
                likedProducts.items.length > 0
                  ? "0px 4px 6px rgba(0, 0, 0, 0.1)"
                  : "none",
            }}
            onClick={() => clearLiked()}
            disabled={
              !likedProducts ||
              !likedProducts.items ||
              likedProducts.items.length === 0
            }
            onMouseEnter={(e) => {
              if (
                likedProducts &&
                likedProducts.items &&
                likedProducts.items.length > 0
              ) {
                e.target.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            Clear
          </button>
          <div className="horizontal-scroll-container" ref={likedScrollRef}>
            {likedProducts.items && likedProducts.items.length > 0 ? (
              likedProducts.items.map((item, idx) => (
                <div key={idx}>
                  <div className="scroll-item-card">
                    <img src={item.product.imageUrl} alt={item.product.name} />
                    <h5>{item.product.name}</h5>
                    <p>{item.product.brand}</p>
                    <p>{item.product.price}</p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "10px",
                      }}
                    >
                      <button
                        style={{
                          backgroundColor: "transparent",
                          color: "#DB3B14",
                          border: "1px solid #DB3B14",
                          borderRadius: "20px",
                          padding: "5px 10px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          marginRight: "10px",
                          flex: 1,
                        }}
                        onClick={() => removeFromLiked(item.product_id)}
                      >
                        Remove
                      </button>
                      <button
                        style={{
                          backgroundColor: "#DB3B14",
                          color: "white",
                          border: "none",
                          borderRadius: "20px",
                          padding: "5px 10px",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          flex: 1,
                        }}
                        onClick={() =>
                          restoreItem(item.product, item.product_id, true)
                        }
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div>
                {isLoggedIn ? (
                  <p>No liked items to show.</p>
                ) : (
                  <>
                    <p>Please Login / Register to see your liked items.</p>
                    <button
                      style={{ ...styles.button, marginRight: "10px" }}
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </button>
                    <button
                      style={styles.button}
                      onClick={() => navigate("/signup")}
                    >
                      Signup
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={discardedModal}
        onHide={() => setDiscardedModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Discarded Items</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <button
            style={{
              backgroundColor:
                discardedProducts &&
                discardedProducts.items &&
                discardedProducts.items.length > 0
                  ? "#DB3B14"
                  : "#ccc",
              color: "white",
              padding: "0.8rem 1.5rem",
              border: "none",
              borderRadius: "20px",
              cursor:
                discardedProducts &&
                discardedProducts.items &&
                discardedProducts.items.length > 0
                  ? "pointer"
                  : "not-allowed",
              fontSize: "1rem",
              fontWeight: "bold",
              transition: "background-color 0.3s ease, transform 0.2s ease",
              boxShadow:
                discardedProducts &&
                discardedProducts.items &&
                discardedProducts.items.length > 0
                  ? "0px 4px 6px rgba(0, 0, 0, 0.1)"
                  : "none",
            }}
            onClick={() => clearDisliked()}
            disabled={
              !discardedProducts ||
              !discardedProducts.items ||
              discardedProducts.items.length === 0
            }
            onMouseEnter={(e) => {
              if (
                discardedProducts &&
                discardedProducts.items &&
                discardedProducts.items.length > 0
              ) {
                e.target.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            Clear
          </button>
          <div className="horizontal-scroll-container" ref={discardedScrollRef}>
            {discardedProducts.items && discardedProducts.items.length > 0 ? (
              discardedProducts.items.map((item, idx) => (
                <div key={idx} className="scroll-item-card">
                  <img src={item.product.imageUrl} alt={item.product.name} />
                  <h5>{item.product.name}</h5>
                  <p>{item.product.brand}</p>
                  <p>{item.product.price}</p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "10px",
                    }}
                  >
                    <button
                      style={{
                        backgroundColor: "transparent",
                        color: "#DB3B14",
                        border: "1px solid #DB3B14",
                        borderRadius: "20px",
                        padding: "5px 10px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        marginRight: "10px",
                        flex: 1,
                      }}
                      onClick={() => removeFromDiscard(item.product_id)}
                    >
                      Remove
                    </button>
                    <button
                      style={{
                        backgroundColor: "#DB3B14",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        padding: "5px 10px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        flex: 1,
                      }}
                      onClick={() =>
                        restoreItem(item.product, item.product_id, false)
                      }
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div>
                {isLoggedIn ? (
                  <p>No discarded items to show.</p>
                ) : (
                  <>
                    <p>Please Login / Register to see your discarded items.</p>
                    <button
                      style={{ ...styles.button, marginRight: "10px" }}
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </button>
                    <button
                      style={styles.button}
                      onClick={() => navigate("/signup")}
                    >
                      Signup
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <Footer />
    </div>
  );
};

export default SwipeBop;
