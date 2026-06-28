import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
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
  where
} from "firebase/firestore";
import { supabase } from "./supabase";
import {
  ArrowUp,
  Award,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Heart,
  Home,
  ImagePlus,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  PackagePlus,
  Phone,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  X
} from "lucide-react";
import { auth, db } from "./firebase";

const phone = "919370017895";
const displayPhone = "+91 93700 17895";
const storeAddress = "1500, Agra Rd, Navnath Nager, Dhule, Maharashtra 424001";
const mapUrl = "https://maps.app.goo.gl/JLybTJ3s9Bg6JMtJ9";
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(storeAddress)}&output=embed`;

const categories = [
  ["Sarees", "Elegant festive, bridal and daily wear sarees.", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80"],
  ["Kurtis", "Comfortable premium kurtis for every day.", "https://images.unsplash.com/photo-1603217040830-34473db521a7?auto=format&fit=crop&w=900&q=80"],
  ["Dresses", "Modern dresses with a boutique finish.", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80"],
  ["Kids Wear", "Bright, soft and stylish outfits for children.", "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80"],
  ["School Uniform", "Neat stitching and reliable fabric quality.", "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=900&q=80"],
  ["New Arrival", "Fresh seasonal styles selected every week.", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"]
].map(([title, desc, image]) => ({ title, desc, image }));

const initialProducts = [
  ["Banarasi Silk Saree", "Sarees", "Rs. 2,499", "In Stock", categories[0].image],
  ["Designer Cotton Kurti", "Kurtis", "Rs. 799", "In Stock", categories[1].image],
  ["Premium Party Dress", "Dresses", "Rs. 1,299", "Limited", categories[2].image],
  ["Kids Festive Set", "Kids Wear", "Rs. 699", "In Stock", categories[3].image],
  ["Smart School Uniform", "School Uniform", "Rs. 599", "In Stock", categories[4].image],
  ["Latest Co-ord Set", "New Arrival", "Rs. 1,099", "New", categories[5].image],
  ["Chanderi Saree", "Sarees", "Rs. 1,899", "In Stock", "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80"],
  ["Printed Rayon Kurti", "Kurtis", "Rs. 649", "In Stock", "https://images.unsplash.com/photo-1603252109360-909baaf261c7?auto=format&fit=crop&w=900&q=80"],
  ["Floral Gown", "Dresses", "Rs. 1,599", "Limited", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80"]
].map(([name, category, price, stock, image], id) => ({ id: id + 1, name, category, price, stock, image }));

const initialOrders = [
  { id: 1024, customer: "Aarti Jain", phone: "9370017895", total: 1299, payment: "UPI", status: "Packed", items: "Premium Party Dress x 1" },
  { id: 1025, customer: "Vivek School", phone: "9370017895", total: 5990, payment: "Cash on Delivery", status: "New", items: "Smart School Uniform x 10" }
];

const gallery = [
  ...categories.map((item) => item.image),
  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80"
];

const navItems = ["Home", "Collections", "Gallery", "About", "Contact", "Cart", "Account", "Admin Login"];
const adminTabs = ["Dashboard", "Products", "Orders", "Messages", "Settings"];
const adminEmail = "admin@chandrakala.com";

function parsePrice(price) {
  return Number(String(price).replace(/[^0-9]/g, "")) || 0;
}

function formatRs(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function whatsappLink(product = "") {
  const text = product
    ? `Hello Chandrakala Fashion Store, I am interested in this product: ${product}.`
    : "Hello Chandrakala Fashion Store, I want to explore your collection.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function firebaseMessage(error) {
  const code = error?.code || "";
  if (code === "auth/configuration-not-found") {
    return "Firebase Authentication is not enabled. Open Firebase Console > Authentication > Sign-in method, enable Email/Password, and save the changes.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Email/Password sign-in is disabled. Enable it in Firebase Console > Authentication > Sign-in method.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "The email or password is incorrect. Use a different email to create a new account, or reset your password.";
  }
  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Please log in with the same email address.";
  }
  if (code === "auth/weak-password") {
    return "Password must be at least 6 characters long.";
  }
  if (code === "permission-denied" || String(error?.message || "").includes("Missing or insufficient permissions")) {
    return "Firestore denied this request. Deploy the Firebase security rules and keep the admin login email as admin@chandrakala.com.";
  }
  if (code === "not-found" || String(error?.message || "").includes("No document to update")) {
    return "This product was not found in Firestore. Refresh the page; if demo products are visible, deploy the Firestore rules first and then add the product.";
  }
  return error?.message || "Firebase request failed.";
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="mb-8">
      <p className="font-bold text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 max-w-2xl text-slate-600">{children}</p>}
    </div>
  );
}

function Header({ page, setPage, adminLoggedIn, userLoggedIn, cartCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const goTo = (item) => {
    setPage(item);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="glass-nav fixed left-0 right-0 top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-white">
        <button onClick={() => goTo("Home")} className="text-left text-xl font-extrabold tracking-wide">
          Chandrakala
        </button>
        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => goTo(item)}
              className={`relative text-sm font-semibold hover:text-accent ${page === item ? "text-accent" : ""}`}
            >
              {item === "Account" && userLoggedIn ? "My Orders" : item}
              {item === "Cart" && cartCount > 0 && (
                <span className="absolute -right-4 -top-3 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs text-dark">
                  {cartCount}
                </span>
              )}
            </button>
          ))}
          {adminLoggedIn && (
            <button onClick={() => goTo("Admin")} className={`text-sm font-semibold hover:text-accent ${page === "Admin" ? "text-accent" : ""}`}>
              Admin
            </button>
          )}
        </div>
        <a href={whatsappLink()} className="hidden rounded-full bg-accent px-5 py-2 text-sm font-bold text-dark md:inline-flex">
          WhatsApp
        </a>
        <button className="md:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>
      {menuOpen && (
        <div className="grid gap-3 px-5 pb-5 text-white md:hidden">
          {[...navItems, ...(adminLoggedIn ? ["Admin"] : [])].map((item) => (
            <button key={item} onClick={() => goTo(item)} className="text-left">
              {item === "Account" && userLoggedIn ? "My Orders" : item}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function ProductCard({ product, addToCart }) {
  return (
    <motion.article whileHover={{ y: -6 }} className="overflow-hidden rounded-lg bg-white shadow-premium">
      <div className="relative">
        <img src={product.image} alt={product.name} className="h-72 w-full object-cover" />
        <button className="absolute right-3 top-3 rounded-full bg-white p-3 text-primary shadow" aria-label="Wishlist">
          <Heart size={18} />
        </button>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-primary">{product.category}</p>
          <span className="rounded-full bg-soft px-3 py-1 text-xs font-bold text-slate-600">{product.stock}</span>
        </div>
        <h3 className="mt-1 text-xl font-bold">{product.name}</h3>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-2xl font-extrabold">{product.price}</span>
          <div className="flex gap-2">
            <button onClick={() => addToCart(product)} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
              Add Cart
            </button>
            <a href={whatsappLink(product.name)} className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-dark">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function HomePage({ setPage, products, addToCart }) {
  return (
    <>
      <section className="hero-bg flex min-h-screen items-center">
        <motion.div
          className="mx-auto w-full max-w-7xl px-4 pt-20 text-white"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
            Chandrakala Men's Wear & Uniform
          </p>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
            Premium fashion and online orders in Dhule.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-2xl">
            Shop sarees, kurtis, kids wear, men's wear and school uniforms with cart, checkout and payment-ready order flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button onClick={() => setPage("Collections")} className="rounded-full bg-primary px-7 py-3 font-bold text-white shadow-premium">
              Explore Collection
            </button>
            <button onClick={() => setPage("Cart")} className="rounded-full bg-accent px-7 py-3 font-bold text-dark">
              View Cart
            </button>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["5000+", "Happy Customers", Users],
          ["10+", "Years Experience", Award],
          ["1000+", "Products", ShoppingBag],
          ["4.8", "Google Rating", Star]
        ].map(([num, label, Icon]) => (
          <motion.div whileHover={{ y: -6 }} className="rounded-lg bg-white p-6 shadow-premium" key={label}>
            <Icon className="mb-4 text-primary" />
            <div className="text-3xl font-extrabold">{num}</div>
            <div className="text-slate-500">{label}</div>
          </motion.div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionTitle eyebrow="Collections" title="Shop by Category">
          Ready collections for family fashion, uniforms and daily wear.
        </SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((item) => (
            <motion.article whileHover={{ y: -6 }} className="group overflow-hidden rounded-lg bg-white shadow-premium" key={item.title}>
              <img src={item.image} alt={item.title} className="h-64 w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="p-5">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-slate-500">{item.desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle eyebrow="Featured Products" title="Popular Picks" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((product) => (
            <ProductCard product={product} addToCart={addToCart} key={product.id} />
          ))}
        </div>
      </section>
    </>
  );
}

function CollectionsPage({ products, addToCart }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = filter === "All" || product.category === filter;
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, products, query]);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-28">
      <SectionTitle eyebrow="Collections" title="Complete Product Catalogue">
        Search products, add to cart, checkout online or order on WhatsApp.
      </SectionTitle>
      <div className="mb-8 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-premium sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-soft px-4 py-3">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="w-full bg-transparent outline-none" />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-full bg-soft px-4 py-3 outline-none">
          {["All", ...categories.map((item) => item.title)].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard product={product} addToCart={addToCart} key={product.id} />
        ))}
      </div>
    </main>
  );
}

function CartPage({ cart, updateQty, removeFromCart, clearCart, userLoggedIn, setPage, placeOrder }) {
  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
    payment: "UPI / Payment Gateway Demo"
  });
  const [placing, setPlacing] = useState(false);
  const total = cart.reduce((sum, item) => sum + parsePrice(item.price) * item.qty, 0);

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!cart.length) return;
    if (!userLoggedIn) {
      setPage("Account");
      return;
    }
    setPlacing(true);
    await placeOrder(checkout);
    setPlacing(false);
    clearCart();
    setPage("Account");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 pt-28 lg:grid-cols-[1fr_420px]">
      <section>
        <SectionTitle eyebrow="Cart" title="Your Shopping Cart">
          Review items, change quantity, then checkout with payment gateway demo or cash on delivery.
        </SectionTitle>
        <div className="overflow-hidden rounded-lg bg-white shadow-premium">
          {cart.length === 0 && <p className="p-6 text-slate-600">Your cart is empty. Add products from Collections.</p>}
          {cart.map((item) => (
            <div className="grid gap-4 border-b border-slate-100 p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center" key={item.id}>
              <img src={item.image} alt={item.name} className="h-24 w-24 rounded-lg object-cover" />
              <div>
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.category} - {item.price}</p>
                <button onClick={() => removeFromCart(item.id)} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-red-600">
                  <Trash2 size={15} /> Remove
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => updateQty(item.id, item.qty - 1)} className="rounded-full bg-soft p-2"><Minus size={16} /></button>
                <span className="w-6 text-center font-bold">{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} className="rounded-full bg-soft p-2"><Plus size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={submitOrder} className="h-fit rounded-lg bg-white p-6 shadow-premium">
        <div className="mb-5 flex items-center gap-3">
          <CreditCard className="text-primary" />
          <h2 className="text-2xl font-extrabold">Checkout</h2>
        </div>
        <div className="mb-4 rounded-lg bg-soft p-4">
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatRs(total)}</span></div>
          <div className="mt-2 flex justify-between text-sm text-slate-600"><span>Delivery</span><span>Store Confirm</span></div>
          <div className="mt-3 flex justify-between text-xl font-extrabold"><span>Total</span><span>{formatRs(total)}</span></div>
        </div>
        <input value={checkout.name} onChange={(event) => setCheckout({ ...checkout, name: event.target.value })} className="mb-3 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Customer name" required />
        <input value={checkout.phone} onChange={(event) => setCheckout({ ...checkout, phone: event.target.value })} className="mb-3 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Phone number" required />
        <textarea value={checkout.address} onChange={(event) => setCheckout({ ...checkout, address: event.target.value })} className="mb-3 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Delivery address" required />
        <select value={checkout.payment} onChange={(event) => setCheckout({ ...checkout, payment: event.target.value })} className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary">
          <option>UPI / Payment Gateway Demo</option>
          <option>Card / Payment Gateway Demo</option>
          <option>Cash on Delivery</option>
          <option>Pay at Store</option>
        </select>
        {!userLoggedIn && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700">Please log in to place an order.</p>}
        <button disabled={placing} className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white">
          {placing ? "Placing Order..." : userLoggedIn ? "Place Online Order" : "Login to Continue"}
        </button>
        <p className="mt-3 text-xs text-slate-500">Live Razorpay or Stripe payments require a merchant account, backend order API, and webhook integration.</p>
      </form>
    </main>
  );
}

function AccountPage({ userLoggedIn, user, userOrders, setPage, customerLogin, logoutUser }) {
  const [form, setForm] = useState({ name: "Customer", phone: "9370017895", email: "customer@chandrakala.com", password: "123456" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await customerLogin(form);
      setMessage("");
    } catch (error) {
      setMessage(firebaseMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!userLoggedIn) {
    return (
      <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 pt-20 lg:grid-cols-2">
        <div>
          <p className="font-bold text-primary">User Login</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Log in to place online orders.</h1>
          <p className="mt-4 text-slate-600">Customer accounts are connected through Firebase Auth. If the account does not exist, this form will create it automatically.</p>
        </div>
        <form onSubmit={login} className="rounded-lg bg-white p-6 shadow-premium">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-primary p-3 text-white"><User /></div>
            <div>
              <h2 className="text-2xl font-extrabold">Customer Login</h2>
              <p className="text-sm text-slate-500">Order history and checkout access</p>
            </div>
          </div>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Name" />
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Phone" />
          <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Email" />
          <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Password" />
          {message && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{message}</p>}
          <button disabled={loading} className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white">
            {loading ? "Connecting..." : "Login / Register"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pt-28">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <SectionTitle eyebrow="Account" title="My Orders">
          {user?.email ? `Online orders for ${user.email} will appear here.` : "Track online orders and continue shopping."}
        </SectionTitle>
        <div className="flex gap-3">
          <button onClick={() => setPage("Collections")} className="rounded-full bg-primary px-5 py-3 font-bold text-white">Shop More</button>
          <button onClick={logoutUser} className="rounded-full bg-dark px-5 py-3 font-bold text-white">Logout</button>
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-premium">
        {userOrders.length === 0 && <p className="text-slate-600">No orders yet. Add items to your cart and complete checkout.</p>}
        {userOrders.map((order) => (
          <div className="grid gap-3 border-b border-slate-100 py-4 md:grid-cols-[1fr_auto_auto] md:items-center" key={order.id}>
            <div>
              <h3 className="font-bold">Order #{order.id}</h3>
              <p className="text-sm text-slate-500">{order.items}</p>
              <p className="text-sm text-slate-500">{order.payment}</p>
            </div>
            <span className="font-extrabold text-primary">{formatRs(order.total)}</span>
            <span className="rounded-full bg-soft px-4 py-2 text-center text-sm font-bold text-slate-700">{order.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

function AdminLoginPage({ adminLogin, setPage }) {
  const [email, setEmail] = useState("admin@chandrakala.com");
  const [password, setPassword] = useState("123456");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await adminLogin(email, password);
      setPage("Admin");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(firebaseMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 pt-20 lg:grid-cols-2">
      <div>
        <p className="font-bold text-primary">Admin Login</p>
        <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Manage products, uploads, orders and payments.</h1>
        <p className="mt-4 text-slate-600">Admin login is connected through Firebase Auth. Admin email: admin@chandrakala.com.</p>
      </div>
      <form onSubmit={login} className="rounded-lg bg-white p-6 shadow-premium">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-full bg-primary p-3 text-white"><LogIn /></div>
          <div>
            <h2 className="text-2xl font-extrabold">Admin Login Panel</h2>
            <p className="text-sm text-slate-500">Demo admin access</p>
          </div>
        </div>
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Admin email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Password" />
        {message && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{message}</p>}
        <button disabled={loading} className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white">
          {loading ? "Connecting..." : "Login to Dashboard"}
        </button>
      </form>
    </main>
  );
}

function AdminPage({ products, orders, saveProduct, deleteProduct, uploadProductImage, updateOrderStatus, logoutUser, setPage }) {
  const [tab, setTab] = useState("Dashboard");
  const [form, setForm] = useState({ name: "", category: "Sarees", price: "", stock: "In Stock", image: categories[0].image });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setForm({ name: "", category: "Sarees", price: "", stock: "In Stock", image: categories[0].image });
    setEditingId(null);
    setMessage("");
  };

  const addProduct = async (event) => {
    event.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    setMessage("");
    try {
      await saveProduct(form, editingId);
      const actionMessage = editingId ? "Product updated successfully." : "Product added successfully.";
      resetForm();
      setMessage(actionMessage);
    } catch (error) {
      setMessage(firebaseMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const image = await uploadProductImage(file);
      setForm((value) => ({ ...value, image }));
      setMessage("Image uploaded successfully.");
    } catch (error) {
      setMessage(error.message || "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || "Sarees",
      price: product.price || "",
      stock: product.stock || "In Stock",
      image: product.image || categories[0].image
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (id) => {
    setMessage("");
    try {
      await deleteProduct(id);
      if (editingId === id) resetForm();
      setMessage("Product deleted successfully.");
    } catch (error) {
      setMessage(firebaseMessage(error));
    }
  };

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-28">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-bold text-primary">Admin Panel</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Chandrakala Management Portal</h1>
        </div>
        <button onClick={logoutUser} className="inline-flex items-center justify-center gap-2 rounded-full bg-dark px-5 py-3 font-bold text-white">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto rounded-lg bg-white p-2 shadow">
        {adminTabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${tab === item ? "bg-primary text-white" : "bg-soft text-slate-600"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && (
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Products", products.length, Boxes],
              ["Orders", orders.length, ShoppingBag],
              ["Messages", 7, MessageSquare],
              ["Revenue", formatRs(revenue), BarChart3]
            ].map(([label, value, Icon]) => (
              <div className="rounded-lg bg-white p-6 shadow-premium" key={label}>
                <Icon className="mb-4 text-primary" />
                <div className="text-3xl font-extrabold">{value}</div>
                <div className="text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-white p-6 shadow-premium">
            <h2 className="mb-4 text-xl font-extrabold">Portal Ready Features</h2>
            {["Image upload preview", "Product add/delete management", "Cart and checkout", "Payment gateway demo", "Customer login and order history", "Admin order status management"].map((item) => (
              <p className="mb-3 flex items-center gap-2 text-slate-600" key={item}>
                <CheckCircle2 className="text-primary" size={18} /> {item}
              </p>
            ))}
          </div>
        </div>
      )}

      {tab === "Products" && (
        <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
          <form onSubmit={addProduct} className="rounded-lg bg-white p-6 shadow-premium">
            <div className="mb-4 flex items-center gap-3">
              <PackagePlus className="text-primary" />
              <h2 className="text-xl font-extrabold">{editingId ? "Edit Product" : "Add Product"}</h2>
            </div>
            <img src={form.image} alt="Product preview" className="mb-3 h-44 w-full rounded-lg object-cover" />
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary bg-blue-50 px-4 py-3 font-bold text-primary">
              <Upload size={18} /> {uploading ? "Uploading..." : "Upload Product Image"}
              <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
            </label>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mb-3 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Product name" />
            <input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mb-3 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Price e.g. Rs. 999" />
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mb-3 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary">
              {categories.map((item) => <option key={item.title}>{item.title}</option>)}
            </select>
            <select value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary">
              {["In Stock", "Limited", "New", "Out of Stock"].map((item) => <option key={item}>{item}</option>)}
            </select>
            {message && <p className={`mb-4 rounded-lg p-3 text-sm font-semibold ${message.includes("failed") || message.includes("deny") || message.includes("Firebase") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{message}</p>}
            <button disabled={saving || uploading} className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white">
              {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="mt-3 w-full rounded-full bg-soft px-6 py-3 font-bold text-slate-700">
                Cancel Edit
              </button>
            )}
          </form>
          <div className="overflow-hidden rounded-lg bg-white shadow-premium">
            {products.map((product) => (
              <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[72px_1fr_auto_auto_auto] sm:items-center" key={product.id}>
                <img src={product.image} alt={product.name} className="h-16 w-16 rounded-lg object-cover" />
                <div>
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-slate-500">{product.category} - {product.stock}</p>
                </div>
                <p className="font-extrabold text-primary">{product.price}</p>
                <button onClick={() => startEdit(product)} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-2 font-bold text-primary">
                  <Pencil size={16} /> Edit
                </button>
                <button onClick={() => removeProduct(product.id)} className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 font-bold text-red-600">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Orders" && (
        <div className="rounded-lg bg-white p-6 shadow-premium">
          <div className="mb-4 flex items-center gap-3">
            <ClipboardList className="text-primary" />
            <h2 className="text-xl font-extrabold">Order Management</h2>
          </div>
          {orders.map((order) => (
            <div className="grid gap-3 border-b border-slate-100 py-4 lg:grid-cols-[1fr_140px_180px] lg:items-center" key={order.id}>
              <div>
                <h3 className="font-bold">Order #{order.id} - {order.customer}</h3>
                <p className="text-sm text-slate-500">{order.items}</p>
                <p className="text-sm text-slate-500">{order.phone} - {order.payment}</p>
              </div>
              <span className="font-extrabold text-primary">{formatRs(order.total)}</span>
              <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} className="rounded-lg border border-slate-200 px-4 py-3 outline-primary">
                {["New", "Payment Pending", "Paid", "Packed", "Out for Delivery", "Completed", "Cancelled"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "Messages" && (
        <AdminList
          icon={MessageSquare}
          title="Customer Messages"
          rows={["Need school uniform size chart", "Is store open today?", "Share new saree photos", "Bulk uniform order details"]}
        />
      )}
      {tab === "Settings" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-premium">
            <Settings className="mb-4 text-primary" />
            <h2 className="text-xl font-extrabold">Store Settings</h2>
            <p className="mt-2 text-slate-600">{storeAddress}</p>
            <p className="mt-2 text-slate-600">{displayPhone}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-premium">
            <CreditCard className="mb-4 text-primary" />
            <h2 className="text-xl font-extrabold">Payment Gateway Ready</h2>
            <p className="mt-2 text-slate-600">Live payments will start after connecting Razorpay or Stripe keys, the backend order creation API, and webhook verification.</p>
          </div>
        </div>
      )}
    </main>
  );
}

function AdminList({ icon: Icon, title, rows }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-premium">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="text-primary" />
        <h2 className="text-xl font-extrabold">{title}</h2>
      </div>
      {rows.map((row, index) => (
        <div className="flex items-center justify-between border-b border-slate-100 py-4" key={row}>
          <span>{row}</span>
          <span className="rounded-full bg-soft px-3 py-1 text-sm font-bold text-primary">New #{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function GalleryPage({ setLightbox }) {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-28">
      <SectionTitle eyebrow="Gallery" title="Store, Customer & Product Photos">
        A visual page for product photos, store updates and new arrivals.
      </SectionTitle>
      <div className="masonry">
        {gallery.map((image, index) => (
          <button key={image} onClick={() => setLightbox(image)} className="masonry-item w-full overflow-hidden rounded-lg bg-white shadow">
            <img src={image} alt={`Chandrakala gallery ${index + 1}`} className="w-full object-cover transition hover:scale-105" />
          </button>
        ))}
      </div>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="pt-24">
      <section className="bg-dark py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle eyebrow="About" title="Trusted local fashion store">
            Chandrakala Men's Wear & Uniform serves Dhule customers with everyday fashion, school uniforms and friendly local service.
          </SectionTitle>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              ["Premium Quality", Sparkles],
              ["Affordable Price", TrendingUp],
              ["Latest Collection", ShoppingBag],
              ["Trusted Shop", ShieldCheck]
            ].map(([title, Icon]) => (
              <div className="rounded-lg bg-white/8 p-6" key={title}>
                <Icon className="mb-4 text-accent" />
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-2 text-white/70">Selected fabric, clean finishing and helpful service.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <video
          className="aspect-video w-full rounded-lg object-cover shadow-premium"
          src="https://videos.pexels.com/video-files/855564/855564-hd_1280_720_25fps.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
      </section>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle eyebrow="Testimonials" title="Customers Love Chandrakala" />
          <div className="grid gap-5 md:grid-cols-3">
            {["Priya Sharma", "Neha Patil", "Aarti Jain"].map((name) => (
              <div className="rounded-lg bg-soft p-6" key={name}>
                <div className="mb-3 flex text-accent">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} fill="currentColor" />)}</div>
                <p className="text-slate-600">The collection feels premium, the staff is helpful, and ordering through WhatsApp was very easy.</p>
                <h3 className="mt-4 font-bold">{name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 pt-28 lg:grid-cols-2">
      <div>
        <SectionTitle eyebrow="Location" title="Visit Our Store" />
        <div className="overflow-hidden rounded-lg shadow-premium">
          <iframe title="Chandrakala Men's Wear & Uniform map" src={mapEmbedUrl} className="h-80 w-full border-0" loading="lazy" />
        </div>
        <div className="mt-5 grid gap-3 text-slate-600">
          <p><MapPin className="mr-2 inline text-primary" size={18} /> {storeAddress}</p>
          <p><Phone className="mr-2 inline text-primary" size={18} /> {displayPhone}</p>
          <p>Google Maps: Chandrakala Men's Wear & Uniform</p>
          <p>Category: Clothing store, Uniform store</p>
          <p>Rating: 4.8 stars from 6 reviews</p>
          <p>Timing: 10:00 AM - 9:00 PM</p>
          <a href={mapUrl} target="_blank" rel="noreferrer" className="font-bold text-primary">
            Open in Google Maps
          </a>
        </div>
      </div>
      <form className="rounded-lg bg-white p-6 shadow-premium">
        <h2 className="mb-5 text-2xl font-extrabold">Contact Us</h2>
        <input className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Name" />
        <input className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Phone" />
        <textarea className="mb-4 min-h-36 w-full rounded-lg border border-slate-200 px-4 py-3 outline-primary" placeholder="Message" />
        <button type="button" className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white">
          Submit
        </button>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a href={`tel:+${phone}`} className="rounded-full bg-dark px-6 py-3 text-center font-bold text-white">Call</a>
          <a href={whatsappLink()} className="rounded-full bg-accent px-6 py-3 text-center font-bold text-dark">WhatsApp</a>
        </div>
      </form>
    </main>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-dark px-4 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
        <div>
          <h2 className="text-2xl font-extrabold">Chandrakala</h2>
          <p className="mt-2 text-white/70">A premium local fashion brand.</p>
        </div>
        <div>
          <h3 className="font-bold">Quick Links</h3>
          <p className="mt-2 text-white/70">Home, Collections, Gallery, About, Contact, Cart</p>
        </div>
        <div>
          <h3 className="font-bold">Portal</h3>
          <p className="mt-2 text-white/70">User login, online order, payment gateway demo, admin management.</p>
        </div>
        <div>
          <h3 className="font-bold">Contact</h3>
          <p className="mt-2 text-white/70">{displayPhone}</p>
          <p className="mt-2 text-white/70">{storeAddress}</p>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl text-sm text-white/60">Copyright (c) 2026 Chandrakala Fashion Store. All rights reserved.</p>
    </footer>
  );
}

function App() {
  const [page, setPage] = useState("Home");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [userOrders, setUserOrders] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [firebaseError, setFirebaseError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setUserLoggedIn(Boolean(user));
      setAdminLoggedIn(user?.email === adminEmail);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let seeded = false;
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      productsQuery,
      async (snapshot) => {
        if (snapshot.empty && adminLoggedIn && !seeded) {
          seeded = true;
          await Promise.all(initialProducts.map(({ id, ...product }) => addDoc(collection(db, "products"), { ...product, createdAt: serverTimestamp() })));
          return;
        }
        if (snapshot.empty) {
          setProducts(initialProducts);
          return;
        }
        setProducts(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
      },
      (error) => setFirebaseError(firebaseMessage(error))
    );
    return unsubscribe;
  }, [adminLoggedIn]);

  useEffect(() => {
    if (!authUser) {
      setOrders(initialOrders);
      setUserOrders([]);
      return undefined;
    }
    let seeded = false;
    const ordersQuery = authUser.email === adminEmail
      ? query(collection(db, "orders"), orderBy("createdAt", "desc"))
      : query(collection(db, "orders"), where("userId", "==", authUser.uid));
    const unsubscribe = onSnapshot(
      ordersQuery,
      async (snapshot) => {
        if (snapshot.empty && authUser.email === adminEmail && !seeded) {
          seeded = true;
          await Promise.all(initialOrders.map((order) => addDoc(collection(db, "orders"), { ...order, createdAt: serverTimestamp() })));
          return;
        }
        const nextOrders = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
        if (authUser.email === adminEmail) {
          setOrders(nextOrders.length ? nextOrders : initialOrders);
        } else {
          setUserOrders(nextOrders);
        }
      },
      (error) => setFirebaseError(firebaseMessage(error))
    );
    return unsubscribe;
  }, [authUser]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (product) => {
    setCart((items) => {
      const found = items.find((item) => item.id === product.id);
      if (found) {
        return items.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...items, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) {
      setCart((items) => items.filter((item) => item.id !== id));
      return;
    }
    setCart((items) => items.map((item) => (item.id === id ? { ...item, qty } : item)));
  };

  const removeFromCart = (id) => setCart((items) => items.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const customerLogin = async ({ name, phone: mobile, email, password }) => {
    if (!email || !password || password.length < 6) {
      throw new Error("Email and a password of at least 6 characters are required.");
    }
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (name && credential.user.displayName !== name) {
        await updateProfile(credential.user, { displayName: name });
      }
      return credential.user;
    } catch (error) {
      if (!["auth/user-not-found", "auth/invalid-credential"].includes(error.code)) {
        throw error;
      }
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name || mobile || "Customer" });
      await addDoc(collection(db, "customers"), {
        uid: credential.user.uid,
        name,
        phone: mobile,
        email,
        createdAt: serverTimestamp()
      });
      return credential.user;
    }
  };

  const adminLogin = async (email, password) => {
    if (email !== adminEmail) {
      throw new Error(`Please use ${adminEmail} for admin login.`);
    }
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (!["auth/user-not-found", "auth/invalid-credential"].includes(error.code)) {
        throw error;
      }
      return createUserWithEmailAndPassword(auth, email, password);
    }
  };

  const logoutUser = () => {
    signOut(auth);
    setPage("Home");
  };

  const saveProduct = async (product, productId = null) => {
    if (productId && !Number.isNaN(Number(productId))) {
      throw new Error("This is a demo product and does not have a Firestore document. Deploy the Firestore rules and refresh the page.");
    }

    const payload = {
      name: product.name.trim(),
      category: product.category,
      price: product.price.trim(),
      stock: product.stock,
      image: product.image,
      priceValue: parsePrice(product.price),
      updatedAt: serverTimestamp()
    };

    if (productId) {
      await updateDoc(doc(db, "products", String(productId)), payload);
      return;
    }

    await addDoc(collection(db, "products"), {
      ...payload,
      createdAt: serverTimestamp()
    });
  };

  const deleteProduct = async (id) => {
    if (!Number.isNaN(Number(id))) {
      throw new Error("This is a demo product and does not have a Firestore document. Deploy the Firestore rules and refresh the page.");
    }
    await deleteDoc(doc(db, "products", String(id)));
  };

  const uploadProductImage = async (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product";
    const fileName = `products/${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from("chandrakala")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("chandrakala")
      .getPublicUrl(fileName);

    if (!data?.publicUrl) {
      throw new Error("Supabase did not return a public image URL. Please check the bucket public access policy.");
    }

    return data.publicUrl;
  };

  const updateOrderStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", String(id)), { status, updatedAt: serverTimestamp() });
  };

  const placeOrder = async (checkout) => {
    const total = cart.reduce((sum, item) => sum + parsePrice(item.price) * item.qty, 0);
    const order = {
      customer: checkout.name,
      customerEmail: authUser?.email || "",
      userId: authUser?.uid || "",
      phone: checkout.phone,
      address: checkout.address,
      payment: checkout.payment,
      total,
      status: checkout.payment.includes("Demo") ? "Payment Pending" : "New",
      items: cart.map((item) => `${item.name} x ${item.qty}`).join(", "),
      lineItems: cart.map((item) => ({ productId: item.id, name: item.name, price: item.price, qty: item.qty })),
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "orders"), order);
  };

  const renderPage = () => {
    if (page === "Collections") return <CollectionsPage products={products} addToCart={addToCart} />;
    if (page === "Gallery") return <GalleryPage setLightbox={setLightbox} />;
    if (page === "About") return <AboutPage />;
    if (page === "Contact") return <ContactPage />;
    if (page === "Cart") {
      return (
        <CartPage
          cart={cart}
          updateQty={updateQty}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          userLoggedIn={userLoggedIn}
          setPage={setPage}
          placeOrder={placeOrder}
        />
      );
    }
    if (page === "Account") {
      return (
        <AccountPage
          userLoggedIn={userLoggedIn}
          user={authUser}
          userOrders={userOrders}
          setPage={setPage}
          customerLogin={customerLogin}
          logoutUser={logoutUser}
        />
      );
    }
    if (page === "Admin Login") return <AdminLoginPage adminLogin={adminLogin} setPage={setPage} />;
    if (page === "Admin") {
      return adminLoggedIn ? (
        <AdminPage
          products={products}
          orders={orders}
          saveProduct={saveProduct}
          deleteProduct={deleteProduct}
          uploadProductImage={uploadProductImage}
          updateOrderStatus={updateOrderStatus}
          logoutUser={logoutUser}
          setPage={setPage}
        />
      ) : (
        <AdminLoginPage adminLogin={adminLogin} setPage={setPage} />
      );
    }
    return <HomePage setPage={setPage} products={products} addToCart={addToCart} />;
  };

  return (
    <div className="min-h-screen bg-soft pb-20 text-dark md:pb-0">
      <Header page={page} setPage={setPage} adminLoggedIn={adminLoggedIn} userLoggedIn={userLoggedIn} cartCount={cartCount} />
      {firebaseError && (
        <div className="fixed left-4 right-4 top-16 z-[70] mx-auto max-w-4xl rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 shadow">
          Firebase: {firebaseError}
        </div>
      )}
      {renderPage()}
      <Footer />

      <div className="fixed bottom-24 right-4 z-40 grid gap-3 md:bottom-6">
        <button onClick={() => setPage("Cart")} className="relative rounded-full bg-accent p-4 text-dark shadow-premium" aria-label="Cart">
          <ShoppingBag />
          {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-dark px-1 text-xs text-white">{cartCount}</span>}
        </button>
        <a href={`tel:+${phone}`} className="rounded-full bg-primary p-4 text-white shadow-premium" aria-label="Call">
          <Phone />
        </a>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-full bg-dark p-4 text-white shadow-premium" aria-label="Back to top">
          <ArrowUp />
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 bg-white px-2 py-2 text-center text-xs font-semibold shadow-2xl md:hidden">
        <button onClick={() => setPage("Home")} className="grid place-items-center gap-1"><Home size={19} />Home</button>
        <button onClick={() => setPage("Collections")} className="grid place-items-center gap-1"><ShoppingBag size={19} />Shop</button>
        <button onClick={() => setPage("Cart")} className="grid place-items-center gap-1"><CreditCard size={19} />Cart</button>
        <button onClick={() => setPage("Admin")} className="grid place-items-center gap-1"><LayoutDashboard size={19} />Admin</button>
      </nav>

      {lightbox && (
        <button className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Gallery preview" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
        </button>
      )}
    </div>
  );
}

export default App;
