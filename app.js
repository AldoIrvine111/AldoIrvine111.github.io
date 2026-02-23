import { db, auth, provider } from './firebase.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- State ---
let currentUser = null;
let allRecipes = [];

// --- DOM ---
const authBtn = document.getElementById('auth-btn');
const userEmail = document.getElementById('user-email');
const addBtn = document.getElementById('add-btn');
const formContainer = document.getElementById('recipe-form-container');
const formTitle = document.getElementById('form-title');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const recipeList = document.getElementById('recipe-list');
const searchInput = document.getElementById('search-input');
const editIdField = document.getElementById('edit-id');

// --- Auth ---
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authBtn.textContent = 'Logout';
    userEmail.textContent = user.email;
    addBtn.style.display = 'block';
  } else {
    authBtn.textContent = 'Login';
    userEmail.textContent = '';
    addBtn.style.display = 'none';
    formContainer.style.display = 'none';
  }
  loadRecipes();
});

authBtn.addEventListener('click', () => {
  if (currentUser) {
    signOut(auth);
  } else {
    signInWithPopup(auth, provider);
  }
});

// --- Load Recipes ---
async function loadRecipes() {
  const q = query(collection(db, 'recipes'), orderBy('created_at', 'desc'));
  const snapshot = await getDocs(q);
  allRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderRecipes(allRecipes);
}

// --- Render ---
function renderRecipes(recipes) {
  recipeList.innerHTML = '';
  recipes.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.title}" />` : ''}
      <h2>${recipe.title}</h2>
      <div class="meta">
        ${recipe.category} · ${recipe.serving} servings · Prep ${recipe.prep_time}m · Cook ${recipe.cook_time}m
      </div>
      <div class="tags">
        ${(recipe.tags || []).map(t => `<span>${t}</span>`).join('')}
      </div>
      ${currentUser ? `
        <div class="card-actions">
          <button onclick="editRecipe('${recipe.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteRecipe('${recipe.id}')">Delete</button>
        </div>` : ''}
    `;
    recipeList.appendChild(card);
  });
}

// --- Search ---
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  const filtered = allRecipes.filter(r =>
    r.title.toLowerCase().includes(term) ||
    (r.category || '').toLowerCase().includes(term) ||
    (r.tags || []).some(t => t.toLowerCase().includes(term))
  );
  renderRecipes(filtered);
});

// --- Form Helpers ---
function clearForm() {
  editIdField.value = '';
  document.getElementById('input-title').value = '';
  document.getElementById('input-category').value = '';
  document.getElementById('input-tags').value = '';
  document.getElementById('input-serving').value = '';
  document.getElementById('input-prep').value = '';
  document.getElementById('input-cook').value = '';
  document.getElementById('input-ingredients').value = '';
  document.getElementById('input-steps').value = '';
  document.getElementById('input-image').value = '';
}

addBtn.addEventListener('click', () => {
  clearForm();
  formTitle.textContent = 'Add Recipe';
  formContainer.style.display = 'flex';
});

cancelBtn.addEventListener('click', () => {
  formContainer.style.display = 'none';
  clearForm();
});

// --- Save (Create / Update) ---
saveBtn.addEventListener('click', async () => {
  const id = editIdField.value;
  const data = {
    title: document.getElementById('input-title').value,
    category: document.getElementById('input-category').value,
    tags: document.getElementById('input-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    serving: parseInt(document.getElementById('input-serving').value) || 0,
    prep_time: parseInt(document.getElementById('input-prep').value) || 0,
    cook_time: parseInt(document.getElementById('input-cook').value) || 0,
    ingredients: document.getElementById('input-ingredients').value.split('\n').map(i => i.trim()).filter(Boolean),
    steps: document.getElementById('input-steps').value.split('\n').map(s => s.trim()).filter(Boolean),
    image_url: document.getElementById('input-image').value.trim(),
  };

  if (id) {
    await updateDoc(doc(db, 'recipes', id), data);
  } else {
    data.created_at = serverTimestamp();
    await addDoc(collection(db, 'recipes'), data);
  }

  formContainer.style.display = 'none';
  clearForm();
  loadRecipes();
});

// --- Edit ---
window.editRecipe = function(id) {
  const recipe = allRecipes.find(r => r.id === id);
  if (!recipe) return;
  editIdField.value = id;
  document.getElementById('input-title').value = recipe.title || '';
  document.getElementById('input-category').value = recipe.category || '';
  document.getElementById('input-tags').value = (recipe.tags || []).join(', ');
  document.getElementById('input-serving').value = recipe.serving || '';
  document.getElementById('input-prep').value = recipe.prep_time || '';
  document.getElementById('input-cook').value = recipe.cook_time || '';
  document.getElementById('input-ingredients').value = (recipe.ingredients || []).join('\n');
  document.getElementById('input-steps').value = (recipe.steps || []).join('\n');
  document.getElementById('input-image').value = recipe.image_url || '';
  formTitle.textContent = 'Edit Recipe';
  formContainer.style.display = 'flex';
};

// --- Delete ---
window.deleteRecipe = async function(id) {
  if (!confirm('Delete this recipe?')) return;
  await deleteDoc(doc(db, 'recipes', id));
  loadRecipes();
};