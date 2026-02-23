import {
  db,
  auth,
  storage,
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
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "./firebase.js";

// --- State ---
let currentUser = null;
let allRecipes = [];
let isAdmin = false;

// --- DOM ---
const authBtn = document.getElementById("auth-btn");
const userEmail = document.getElementById("user-email");
const addBtn = document.getElementById("add-btn");
const formModal = document.getElementById("recipe-form-modal");
const formTitle = document.getElementById("form-title");
const formCloseBtn = document.getElementById("form-close-btn");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const recipeList = document.getElementById("recipe-list");
const searchInput = document.getElementById("search-input");
const editIdField = document.getElementById("edit-id");
const recipeModal = document.getElementById("recipe-modal");
const recipeModalContent = document.getElementById("recipe-modal-content");
const recipeModalClose = document.getElementById("recipe-modal-close");

// --- Admin Check ---
async function checkAdmin(user) {
  const adminDoc = await getDoc(doc(db, "admins", user.uid));
  return adminDoc.exists();
}

// --- Auth ---
let authInProgress = false;

onAuthStateChanged(auth, async (user) => {
  const loader = document.getElementById("auth-loader");
  if (loader) loader.style.display = "none";
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
    closeFormModal();
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
      if (e.code !== "auth/cancelled-popup-request") console.error(e);
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

  window.openRecipe = function (id) {
    const recipe = allRecipes.find((r) => r.id === id);
    if (!recipe) return;

    recipeModalContent.innerHTML = `
      ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.title}" />` : ""}
      <div class="modal-category">${recipe.category || "Uncategorised"}</div>
      <h2>${recipe.title}</h2>
      <div class="modal-meta">
        <span>🍽 ${recipe.serving || "—"} servings</span>
        <span>⏱ Prep ${recipe.prep_time || "—"}m</span>
        <span>🔥 Cook ${recipe.cook_time || "—"}m</span>
      </div>
      <div class="modal-tags">
        ${(recipe.tags || []).map((t) => `<span>${t}</span>`).join("")}
      </div>
      <h3>Ingredients</h3>
      <ul>
        ${(recipe.ingredients || []).map((i) => `<li>${i}</li>`).join("")}
      </ul>
      <h3>Steps</h3>
      <ol>
        ${(recipe.steps || []).map((s) => `<li>${s}</li>`).join("")}
      </ol>
    `;

    recipeModal.style.display = "flex";
    document.body.style.paddingRight =
      window.innerWidth - document.documentElement.clientWidth + "px";
    document.body.style.overflow = "hidden";
  };

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      if (e.target.closest(".card-actions")) return;
      openRecipe(recipe.id);
    });

    const imageHtml = recipe.image_url
      ? `<img class="card-image" src="${recipe.image_url}" alt="${recipe.title}" />`
      : `<div class="card-image-placeholder">🍽️</div>`;

    const tagsHtml = (recipe.tags || [])
      .map((t) => `<span>${t}</span>`)
      .join("");

    const actionsHtml = isAdmin
      ? `<div class="card-actions">
          <button class="edit-btn" onclick="editRecipe('${recipe.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteRecipe('${recipe.id}')">Delete</button>
        </div>`
      : "";

    card.innerHTML = `
      ${imageHtml}
      <div class="card-body">
        <div class="category">${recipe.category || "Uncategorised"}</div>
        <h2 onclick="openRecipe('${recipe.id}')" style="cursor:pointer;">${recipe.title}</h2>
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

// --- Form Modal ---
function openFormModal() {
  formModal.style.display = "flex";
  document.body.style.paddingRight =
    window.innerWidth - document.documentElement.clientWidth + "px";
  document.body.style.overflow = "hidden";
}

function closeFormModal() {
  const box = document.getElementById("recipe-form-box");
  if (!box) return;
  box.style.animation = "fadeOut 0.2s ease forwards";
  setTimeout(() => {
    formModal.style.display = "none";
    box.style.animation = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    clearForm();
  }, 120);
}

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
  const imageInput = document.getElementById("input-image");
  imageInput.replaceWith(imageInput.cloneNode(true));
}

addBtn.addEventListener("click", () => {
  clearForm();
  formTitle.textContent = "Add Recipe";
  openFormModal();
});

formCloseBtn.addEventListener("click", closeFormModal);
cancelBtn.addEventListener("click", closeFormModal);

formModal.addEventListener("click", (e) => {
  if (e.target === formModal) closeFormModal();
});

// --- Recipe Modal Close ---
function closeRecipeModal() {
  const box = document.getElementById("recipe-modal-box");
  box.style.animation = "fadeOut 0.2s ease forwards";
  setTimeout(() => {
    recipeModal.style.display = "none";
    box.style.animation = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }, 120);
}

recipeModalClose.addEventListener("click", closeRecipeModal);
recipeModal.addEventListener("click", (e) => {
  if (e.target === recipeModal) closeRecipeModal();
});

// --- Save (Create / Update) ---
saveBtn.addEventListener("click", async () => {
  const id = editIdField.value;
  const fileInput = document.getElementById("input-image");
  const file = fileInput.files[0];

  let image_url = "";
  let image_path = "";

  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const ext = file.name.split(".").pop();
    image_path = `recipes/${hashHex}.${ext}`;

    const existingRecipeWithSameImage = allRecipes.find(
      (r) => r.image_path === image_path,
    );
    if (existingRecipeWithSameImage) {
      image_url = existingRecipeWithSameImage.image_url;
    } else {
      const storageRef = ref(storage, image_path);
      await uploadBytes(storageRef, file);
      image_url = await getDownloadURL(storageRef);
    }
  } else if (id) {
    const existing = allRecipes.find((r) => r.id === id);
    image_url = existing ? existing.image_url : "";
    image_path = existing ? existing.image_path : "";
  }

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
    image_url,
    image_path,
  };

  if (id) {
    await updateDoc(doc(db, "recipes", id), data);
  } else {
    data.created_at = serverTimestamp();
    await addDoc(collection(db, "recipes"), data);
  }

  closeFormModal();
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
  formTitle.textContent = "Edit Recipe";
  openFormModal();
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
  const recipe = allRecipes.find((r) => r.id === pendingDeleteId);

  if (recipe && recipe.image_path) {
    const otherRecipesUsingSameImage = allRecipes.filter(
      (r) => r.id !== pendingDeleteId && r.image_path === recipe.image_path,
    );
    if (otherRecipesUsingSameImage.length === 0) {
      try {
        await deleteObject(ref(storage, recipe.image_path));
      } catch (e) {
        console.warn("Image delete failed:", e);
      }
    }
  }

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

// --- Escape Key ---
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (recipeModal.style.display === "flex") {
    closeRecipeModal();
    return;
  }
  if (formModal.style.display === "flex") {
    closeFormModal();
    return;
  }
  if (deleteModal.style.display === "flex") {
    deleteModal.style.display = "none";
    pendingDeleteId = null;
  }
});
