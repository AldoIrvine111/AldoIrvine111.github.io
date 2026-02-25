# My Cookbook

A personal recipe collection built with vanilla JavaScript and Firebase, hosted on GitHub Pages. Clean, fast, and requires no backend.

## What it does

- Browse recipes in a card grid with search and filtering
- Click any card to open a full recipe detail view with ingredients and steps
- Add, edit, and delete recipes through a modal form
- Upload photos per recipe stored in Firebase Storage
- Google Sign-In gates all access — only authorised users can view
- Admin accounts can create and manage recipes; regular users are read-only

## Tech Stack

| Layer    | Tool                             |
| -------- | -------------------------------- |
| Hosting  | GitHub Pages                     |
| Frontend | HTML, CSS, Vanilla JS            |
| Database | Firebase Firestore               |
| Storage  | Firebase Storage                 |
| Auth     | Firebase Authentication (Google) |
| AI       | Claude Sonnet 4.6                |

## Project Structure

```
├── index.html        — Main page and all modal markup
├── app.js            — Core logic: auth, recipes, modals, search
├── firebase.js       — Firebase initialisation and exports
├── easter.js         — You'll figure it out
├── style.css         — All styling
└── importer.html     — Local tool for bulk importing recipes via JSON
```

## Access Control

- **Public** — nobody. Login is required to view anything
- **Authenticated users** — can view and browse all recipes
- **Admins** — can add, edit, and delete recipes. Admin access is managed via a Firestore `admins` collection using Google UIDs as document IDs

## Adding an Admin

1. Have the user sign in to the site with their Google account
2. Find their UID in Firebase Console → Authentication → Users
3. Create a document in Firestore → `admins` collection with their UID as the document ID and an `email` field for reference
4. They will see admin controls on next login

## Bulk Import

To add multiple recipes at once, open `importer.html` locally via a Python server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/importer.html`, paste a JSON array of recipes and click Import.

## Recipe JSON Schema

```json
{
  "title": "Pasta Carbonara",
  "category": "Italian",
  "tags": ["pasta", "quick", "egg"],
  "serving": 2,
  "prep_time": 10,
  "cook_time": 15,
  "image_url": "",
  "image_path": "",
  "ingredients": ["200g spaghetti", "2 eggs", "100g pancetta"],
  "steps": ["Boil pasta", "Fry pancetta", "Combine off heat"]
}
```

## Security

- Firebase API key is public by design — domain restricted to this GitHub Pages URL and `cookbook-5.firebaseapp.com` only
- Firestore rules enforce read requires authentication, write requires admin UID match
- Storage rules mirror Firestore — only admins can upload or delete images
- Images are content-hashed on upload to deduplicate storage

## Local Development

No build tools required. Clone the repo and open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
```

Note: Firebase Auth requires a served origin — opening the file directly via `file://` will block Google Sign-In.