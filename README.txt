CHANDRAKALA FASHION — COMPLETE E-COMMERCE PACKAGE

CUSTOMER
- index.html: polished storefront; no Admin link
- Product catalogue, categories, gallery, cart, customer account, order history
- COD checkout
- Razorpay online checkout prepared end-to-end through Firebase Functions
- WhatsApp, phone and Google Maps

ADMIN
- admin.html is a separate private entry
- Product add/edit/delete + image upload
- Gallery multi-upload + delete + reorder
- Order list + status updates
- Payment Gateway settings: enable/disable, Razorpay public Key ID, UPI ID
- Store profile settings

FIREBASE SETUP
1. Firebase Console > Authentication > Sign-in method > Email/Password ON.
2. Create the admin account exactly: admin@chandrakala.com with your own strong password.
3. Ensure Firestore and Storage are enabled.
4. Install Firebase CLI on your PC if you don't already have it.
5. In this folder run:
   firebase login
   firebase use chandrakala-bd6f8
   firebase deploy --only firestore:rules,storage
6. Install functions dependencies:
   cd functions
   npm install
   cd ..
7. Set Razorpay Secret securely (NEVER put it in frontend or Firestore):
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
8. Deploy functions:
   firebase deploy --only functions
9. In admin.html > Payments, enable online payments and enter the Razorpay PUBLIC Key ID (rzp_test_... for testing or rzp_live_... for production).
10. Deploy website:
   firebase deploy --only hosting

PAYMENT SECURITY
Razorpay requires a server-side order before checkout and server-side signature verification. This package includes both Firebase callable functions. The secret is stored as a Firebase Functions secret, not in the browser. Do not paste the secret key into the admin panel. Razorpay live payments also require HTTPS and a properly configured live account.

LOCAL PREVIEW
Because browser security can block ES modules on file://, use:
  py -m http.server 8080
then open http://localhost:8080/
and http://localhost:8080/admin.html

IMPORTANT
The Firebase web config is intended to be public. Security comes from Firebase Auth + Firestore/Storage rules. Change the admin password immediately and do not share it.
