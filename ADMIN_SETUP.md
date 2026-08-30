# Chandrakala Fashion — Admin setup

The customer-facing website no longer contains an Admin/Login link.

## Private admin URL

After deployment, open:

`/admin.html`

This is a separate Vite entry. It shows only the admin login screen to unauthenticated visitors.

## Admin account

The admin portal accepts only the Firebase account:

`admin@chandrakala.com`

Create/maintain that account in Firebase Authentication with a strong private password. The portal does **not** auto-create an admin account and does not display a default password.

## Important security

Firestore rules allow product/order management only to the admin email above. Keep those rules deployed with Firebase.

## Build/deploy

From the project folder:

```bash
npm install
npm run build
firebase deploy
```

Vite will build both `index.html` (customer site) and `admin.html` (private admin entry).
