const API_URL = "http://localhost:5001/api";

// User Recipes
export const userRecipesAPI = {
  getAll: () => fetch(`${API_URL}/user-recipes`).then(res => res.json()),
  getByUser: (userId) => fetch(`${API_URL}/user-recipes/user/${userId}`).then(res => res.json()),
  getById: (id) => fetch(`${API_URL}/user-recipes/${id}`).then(res => res.json()),
  create: (data) => fetch(`${API_URL}/user-recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  update: (id, data) => fetch(`${API_URL}/user-recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  delete: (id, userId) => fetch(`${API_URL}/user-recipes/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).then(res => res.json()),
};

// Comments
export const commentsAPI = {
  getByRecipe: (recipeId, isUserRecipe = false) => 
    fetch(`${API_URL}/comments/${recipeId}?isUserRecipe=${isUserRecipe}`).then(res => res.json()),
  getRating: (recipeId, isUserRecipe = false) => 
    fetch(`${API_URL}/comments/${recipeId}/rating?isUserRecipe=${isUserRecipe}`).then(res => res.json()),
  create: (data) => fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  delete: (id, userId) => fetch(`${API_URL}/comments/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).then(res => res.json()),
};

// Shopping Lists
export const shoppingListsAPI = {
  getByUser: (userId) => fetch(`${API_URL}/shopping-lists/user/${userId}`).then(res => res.json()),
  getById: (id) => fetch(`${API_URL}/shopping-lists/${id}`).then(res => res.json()),
  create: (data) => fetch(`${API_URL}/shopping-lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  update: (id, data) => fetch(`${API_URL}/shopping-lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  delete: (id, userId) => fetch(`${API_URL}/shopping-lists/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).then(res => res.json()),
};

// Meal Plans
export const mealPlansAPI = {
  getByUser: (userId, startDate, endDate) => {
    let url = `${API_URL}/meal-plans/user/${userId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return fetch(url).then(res => res.json());
  },
  create: (data) => fetch(`${API_URL}/meal-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  delete: (id, userId) => fetch(`${API_URL}/meal-plans/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).then(res => res.json()),
};

// Collections
export const collectionsAPI = {
  getByUser: (userId) => fetch(`${API_URL}/collections/user/${userId}`).then(res => res.json()),
  getPublic: () => fetch(`${API_URL}/collections/public`).then(res => res.json()),
  getById: (id) => fetch(`${API_URL}/collections/${id}`).then(res => res.json()),
  create: (data) => fetch(`${API_URL}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  update: (id, data) => fetch(`${API_URL}/collections/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  delete: (id, userId) => fetch(`${API_URL}/collections/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).then(res => res.json()),
  addItem: (collectionId, data) => fetch(`${API_URL}/collections/${collectionId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  removeItem: (collectionId, itemId) => fetch(`${API_URL}/collections/${collectionId}/items/${itemId}`, {
    method: "DELETE",
  }).then(res => res.json()),
};

// User Profiles
export const profilesAPI = {
  get: (userId) => fetch(`${API_URL}/profiles/${userId}`).then(res => res.json()),
  createOrUpdate: (data) => fetch(`${API_URL}/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
};

// Notifications
export const notificationsAPI = {
  getByUser: (userId) => fetch(`${API_URL}/notifications/user/${userId}`).then(res => res.json()),
  getUnreadCount: (userId) => fetch(`${API_URL}/notifications/user/${userId}/unread-count`).then(res => res.json()),
  create: (data) => fetch(`${API_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  markAsRead: (id, userId) => fetch(`${API_URL}/notifications/${id}/read`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).then(res => res.json()),
  markAllAsRead: (userId) => fetch(`${API_URL}/notifications/user/${userId}/read-all`, {
    method: "PUT",
  }).then(res => res.json()),
  delete: (id, userId) => fetch(`${API_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).then(res => res.json()),
};
