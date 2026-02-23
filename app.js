import {
  db,
  auth,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
} from "./firebase.js";

// --- State ---
let currentUser = null;
let allRecipes = [];
let isAdmin = false;

// --- DOM ---
const authBtn = document.getElementById("auth-btn");
const userEmail = document.getElementById("user-email");
const addBtn = document.getElementById("add-btn");
const formContainer = document.getElementById("recipe-form-container");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const recipeList = document.getElementById("recipe-list");
const searchInput = document.getElementById("search-input");
const editIdField = document.getElementById("edit-id");

// --- Admin Check ---
async function checkAdmin(user) {
  const adminDoc = await getDoc(doc(db, "admins", user.uid));
  console.log("UID:", user.uid);
  console.log("Admin doc exists:", adminDoc.exists());
  return adminDoc.exists();
}

// --- Auth ---
let authInProgress = false;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    document.getElementById("landing").style.display = "none";
    authBtn.textContent = "Logout";
    userEmail.textContent = user.email;
    isAdmin = await checkAdmin(user);
    addBtn.style.display = isAdmin ? "block" : "none";
    document.querySelector("main").style.display = "block";
    loadRecipes();
  } else {
    document.getElementById("landing").style.display = "flex";
    authBtn.textContent = "Login";
    userEmail.textContent = "";
    isAdmin = false;
    addBtn.style.display = "none";
    formContainer.style.display = "none";
    document.querySelector("main").style.display = "none";
    recipeList.innerHTML = "";
  }
});

authBtn.addEventListener("click", async () => {
  if (currentUser) {
    signOut(auth);
  } else {
    if (authInProgress) return;
    authInProgress = true;
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code !== "auth/cancelled-popup-request") {
        console.error(e);
      }
    } finally {
      authInProgress = false;
    }
  }
});

document
  .getElementById("landing-login-btn")
  .addEventListener("click", async () => {
    if (authInProgress) return;
    authInProgress = true;
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code !== "auth/cancelled-popup-request") console.error(e);
    } finally {
      authInProgress = false;
    }
  });

// --- Load Recipes ---
async function loadRecipes() {
  const q = query(collection(db, "recipes"), orderBy("created_at", "desc"));
  const snapshot = await getDocs(q);
  allRecipes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderRecipes(allRecipes);
}

// --- Render ---
function renderRecipes(recipes) {
  recipeList.innerHTML = "";

  if (recipes.length === 0) {
    recipeList.innerHTML = `
      <div class="empty-state">
        <p>No recipes yet. Start adding your favourites.</p>
      </div>`;
    return;
  }

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const imageHtml = recipe.image_url
      ? `<img class="card-image" src="${recipe.image_url}" alt="${recipe.title}" />`
      : `<div class="card-image-placeholder">🍽️</div>`;

    const tagsHtml = (recipe.tags || [])
      .map((t) => `<span>${t}</span>`)
      .join("");

    const actionsHtml = isAdmin
      ? `
      <div class="card-actions">
        <button class="edit-btn" onclick="editRecipe('${recipe.id}')">Edit</button>
        <button class="delete-btn" onclick="deleteRecipe('${recipe.id}')">Delete</button>
      </div>`
      : "";

    card.innerHTML = `
      ${imageHtml}
      <div class="card-body">
        <div class="category">${recipe.category || "Uncategorised"}</div>
        <h2>${recipe.title}</h2>
        <div class="meta">
          <span class="meta-item">🍽 ${recipe.serving || "—"} servings</span>
          <span class="meta-item">⏱ Prep ${recipe.prep_time || "—"}m</span>
          <span class="meta-item">🔥 Cook ${recipe.cook_time || "—"}m</span>
        </div>
        <div class="tags">${tagsHtml}</div>
        ${actionsHtml}
      </div>
    `;

    recipeList.appendChild(card);
  });
}

// --- Search ---
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = allRecipes.filter(
    (r) =>
      r.title.toLowerCase().includes(term) ||
      (r.category || "").toLowerCase().includes(term) ||
      (r.tags || []).some((t) => t.toLowerCase().includes(term)),
  );
  renderRecipes(filtered);
});

// --- Form Helpers ---
function clearForm() {
  editIdField.value = "";
  document.getElementById("input-title").value = "";
  document.getElementById("input-category").value = "";
  document.getElementById("input-tags").value = "";
  document.getElementById("input-serving").value = "";
  document.getElementById("input-prep").value = "";
  document.getElementById("input-cook").value = "";
  document.getElementById("input-ingredients").value = "";
  document.getElementById("input-steps").value = "";
  document.getElementById("input-image").value = "";
}

addBtn.addEventListener("click", () => {
  clearForm();
  formTitle.textContent = "Add Recipe";
  formContainer.style.display = "flex";
  formContainer.scrollIntoView({ behavior: "smooth" });
});

cancelBtn.addEventListener("click", () => {
  formContainer.style.display = "none";
  clearForm();
});

// --- Save (Create / Update) ---
saveBtn.addEventListener("click", async () => {
  const id = editIdField.value;
  const data = {
    title: document.getElementById("input-title").value,
    category: document.getElementById("input-category").value,
    tags: document
      .getElementById("input-tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    serving: parseInt(document.getElementById("input-serving").value) || 0,
    prep_time: parseInt(document.getElementById("input-prep").value) || 0,
    cook_time: parseInt(document.getElementById("input-cook").value) || 0,
    ingredients: document
      .getElementById("input-ingredients")
      .value.split("\n")
      .map((i) => i.trim())
      .filter(Boolean),
    steps: document
      .getElementById("input-steps")
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    image_url: document.getElementById("input-image").value.trim(),
  };

  if (id) {
    await updateDoc(doc(db, "recipes", id), data);
  } else {
    data.created_at = serverTimestamp();
    await addDoc(collection(db, "recipes"), data);
  }

  formContainer.style.display = "none";
  clearForm();
  loadRecipes();
});

// --- Edit ---
window.editRecipe = function (id) {
  const recipe = allRecipes.find((r) => r.id === id);
  if (!recipe) return;
  editIdField.value = id;
  document.getElementById("input-title").value = recipe.title || "";
  document.getElementById("input-category").value = recipe.category || "";
  document.getElementById("input-tags").value = (recipe.tags || []).join(", ");
  document.getElementById("input-serving").value = recipe.serving || "";
  document.getElementById("input-prep").value = recipe.prep_time || "";
  document.getElementById("input-cook").value = recipe.cook_time || "";
  document.getElementById("input-ingredients").value = (
    recipe.ingredients || []
  ).join("\n");
  document.getElementById("input-steps").value = (recipe.steps || []).join(
    "\n",
  );
  document.getElementById("input-image").value = recipe.image_url || "";
  formTitle.textContent = "Edit Recipe";
  formContainer.style.display = "flex";
  formContainer.scrollIntoView({ behavior: "smooth" });
};

// --- Delete Modal ---
let pendingDeleteId = null;
const deleteModal = document.getElementById("delete-modal");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

window.deleteRecipe = function (id) {
  pendingDeleteId = id;
  deleteModal.style.display = "flex";
};

modalCancelBtn.addEventListener("click", () => {
  deleteModal.style.display = "none";
  pendingDeleteId = null;
});

modalConfirmBtn.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  await deleteDoc(doc(db, "recipes", pendingDeleteId));
  deleteModal.style.display = "none";
  pendingDeleteId = null;
  loadRecipes();
});

deleteModal.addEventListener("click", (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = "none";
    pendingDeleteId = null;
  }
});
