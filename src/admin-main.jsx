import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AdminLoginPage, AdminPage, auth, db, supabase, initialProducts, initialOrders, adminEmail, firebaseMessage, parsePrice } from "./App.jsx";
import "./index.css";

function AdminApp() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (next) => {
    setUser(next);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (!user || user.email !== adminEmail) return;
    let seeded = false;
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !seeded) {
        seeded = true;
        await Promise.all(initialProducts.map(({ id, ...product }) => addDoc(collection(db, "products"), {
          ...product, priceValue: parsePrice(product.price), createdAt: serverTimestamp()
        })));
        return;
      }
      setProducts(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
    }, (e) => setError(firebaseMessage(e)));
  }, [user]);

  useEffect(() => {
    if (!user || user.email !== adminEmail) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
    }, (e) => setError(firebaseMessage(e)));
  }, [user]);

  const adminLogin = async (email, password) => {
    if (email !== adminEmail) throw new Error(`Please use ${adminEmail} for admin login.`);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logoutUser = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  const saveProduct = async (product, productId = null) => {
    const payload = {
      name: product.name.trim(),
      category: product.category,
      price: product.price.trim(),
      stock: product.stock,
      image: product.image,
      priceValue: parsePrice(product.price),
      updatedAt: serverTimestamp(),
    };
    if (!payload.name || !payload.price || !payload.image) throw new Error("Product name, price and image are required.");
    if (productId) await updateDoc(doc(db, "products", String(productId)), payload);
    else await addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
  };

  const deleteProduct = async (id) => deleteDoc(doc(db, "products", String(id)));

  const uploadProductImage = async (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "product";
    const fileName = `products/${Date.now()}-${safeName}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("chandrakala").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
    const { data } = supabase.storage.from("chandrakala").getPublicUrl(fileName);
    if (!data?.publicUrl) throw new Error("Could not create a public image URL.");
    return data.publicUrl;
  };

  const updateOrderStatus = async (id, status) => updateDoc(doc(db, "orders", String(id)), { status, updatedAt: serverTimestamp() });

  if (!authReady) return <div className="grid min-h-screen place-items-center bg-soft"><div className="rounded-2xl bg-white p-8 shadow-premium"><p className="font-bold">Loading secure admin...</p></div></div>;

  if (!user || user.email !== adminEmail) {
    return <><AdminLoginPage adminLogin={adminLogin} setPage={() => {}} />{error && <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-xl rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}</>;
  }

  return <><AdminPage products={products} orders={orders} saveProduct={saveProduct} deleteProduct={deleteProduct} uploadProductImage={uploadProductImage} updateOrderStatus={updateOrderStatus} logoutUser={logoutUser} setPage={() => {}} />{error && <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-xl rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}</>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><AdminApp /></React.StrictMode>);
