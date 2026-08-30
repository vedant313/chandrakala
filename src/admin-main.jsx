import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { supabase } from "./supabase";
import { auth, db } from "./firebase";
import { AdminLoginPage, AdminPage } from "./App";
import "./index.css";

const ADMIN_EMAIL = "admin@chandrakala.com";
const fallbackProducts = [
  { name: "Banarasi Silk Saree", category: "Sarees", price: "Rs. 2,499", stock: "In Stock", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80" },
  { name: "Designer Cotton Kurti", category: "Kurtis", price: "Rs. 799", stock: "In Stock", image: "https://images.unsplash.com/photo-1603217040830-34473db521a7?auto=format&fit=crop&w=900&q=80" },
  { name: "Premium Party Dress", category: "Dresses", price: "Rs. 1,299", stock: "Limited", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80" }
];
const fallbackOrders = [];
const priceValue = (value) => Number(String(value).replace(/[^0-9]/g, "")) || 0;

function AdminApp() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState(fallbackProducts.map((p, i) => ({ ...p, id: `demo-${i}` })));
  const [orders, setOrders] = useState(fallbackOrders);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setReady(true); }), []);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    const unsubscribeProducts = onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      (snapshot) => setProducts(snapshot.empty ? fallbackProducts.map((p, i) => ({ ...p, id: `demo-${i}` })) : snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => setError(err.message)
    );
    const unsubscribeOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snapshot) => setOrders(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (err) => setError(err.message)
    );
    return () => { unsubscribeProducts(); unsubscribeOrders(); };
  }, [user]);

  const login = async (email, password) => {
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) throw new Error("This account is not authorized for the admin panel.");
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
  };
  const logout = async () => { await signOut(auth); };
  const saveProduct = async (product, id = null) => {
    if (id && String(id).startsWith("demo-")) throw new Error("Demo products are read-only until real products are added from the admin panel.");
    const payload = { name: product.name.trim(), category: product.category, price: product.price.trim(), stock: product.stock, image: product.image, priceValue: priceValue(product.price), updatedAt: serverTimestamp() };
    if (id) return updateDoc(doc(db, "products", String(id)), payload);
    return addDoc(collection(db, "products"), { ...payload, createdAt: serverTimestamp() });
  };
  const deleteProduct = async (id) => {
    if (String(id).startsWith("demo-")) throw new Error("Demo products cannot be deleted.");
    return deleteDoc(doc(db, "products", String(id)));
  };
  const uploadProductImage = async (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safe = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "product";
    const path = `products/${Date.now()}-${safe}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("chandrakala").upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
    return supabase.storage.from("chandrakala").getPublicUrl(path).data.publicUrl;
  };
  const updateOrderStatus = (id, status) => updateDoc(doc(db, "orders", String(id)), { status, updatedAt: serverTimestamp() });

  if (!ready) return <div className="grid min-h-screen place-items-center bg-soft p-6"><div className="rounded-2xl bg-white p-8 shadow-premium font-bold">Loading secure admin…</div></div>;
  if (!user || user.email !== ADMIN_EMAIL) return <AdminLoginPage adminLogin={login} setPage={() => {}} />;
  return <><AdminPage products={products} orders={orders} saveProduct={saveProduct} deleteProduct={deleteProduct} uploadProductImage={uploadProductImage} updateOrderStatus={updateOrderStatus} logoutUser={logout} setPage={() => {}} />{error && <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-3xl rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-lg">{error}</div>}</>;
}

createRoot(document.getElementById("root")).render(<AdminApp />);
