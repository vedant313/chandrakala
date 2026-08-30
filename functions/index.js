const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();
const razorSecret = defineSecret('RAZORPAY_KEY_SECRET');

async function settings() {
  const snap = await db.doc('settings/store').get();
  return snap.exists ? snap.data() : {};
}

exports.createRazorpayOrder = onCall({ secrets: [razorSecret], cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in before checkout.');
  const { items = [], customer = '', phone = '', address = '' } = request.data || {};
  if (!Array.isArray(items) || !items.length) throw new HttpsError('invalid-argument', 'Cart is empty.');
  const s = await settings();
  if (!s.paymentEnabled || !s.razorpayKeyId) throw new HttpsError('failed-precondition', 'Online payment is not enabled.');

  let total = 0;
  const cleanItems = [];
  for (const item of items) {
    const qty = Math.max(1, Math.min(20, Number(item.qty || 1)));
    const snap = await db.doc(`products/${item.productId}`).get();
    if (!snap.exists) throw new HttpsError('not-found', `Product ${item.productId} not found.`);
    const p = snap.data();
    const price = Number(p.price || 0);
    if (!Number.isFinite(price) || price <= 0) throw new HttpsError('failed-precondition', 'Invalid product price.');
    total += price * qty;
    cleanItems.push({ productId: item.productId, name: p.name, qty, price });
  }
  if (total <= 0) throw new HttpsError('failed-precondition', 'Invalid total.');

  const receipt = `CF${Date.now()}`.slice(0, 40);
  const rp = new Razorpay({ key_id: s.razorpayKeyId, key_secret: razorSecret.value() });
  const rOrder = await rp.orders.create({ amount: Math.round(total * 100), currency: 'INR', receipt, payment_capture: 1 });
  const internal = await db.collection('orders').add({
    userId: request.auth.uid, customer, phone, address, items: cleanItems, total,
    payment: 'Razorpay', status: 'Payment Pending', razorpayOrderId: rOrder.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { razorpayOrderId: rOrder.id, amount: Math.round(total * 100), internalOrderId: internal.id };
});

exports.verifyRazorpayPayment = onCall({ secrets: [razorSecret], cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in.');
  const { internalOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.data || {};
  if (!internalOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) throw new HttpsError('invalid-argument', 'Missing payment verification fields.');
  const ref = db.doc(`orders/${internalOrderId}`);
  const snap = await ref.get();
  if (!snap.exists || snap.data().userId !== request.auth.uid) throw new HttpsError('permission-denied', 'Order not found.');
  const expected = crypto.createHmac('sha256', razorSecret.value()).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(razorpaySignature)));
  if (!ok) throw new HttpsError('permission-denied', 'Payment signature verification failed.');
  await ref.update({ status: 'Paid', razorpayPaymentId, razorpaySignature, paidAt: admin.firestore.FieldValue.serverTimestamp() });
  return { ok: true };
});
