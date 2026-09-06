import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getDatabase, ref, set, push, remove, update, onValue } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

// Firebase Configuration (Same Project ID)
const firebaseConfig = {
  apiKey: "AIzaSyBySOEfSbkpl4csyqckfX-kLeIoD-85VYs",
  authDomain: "my-friend-hub.firebaseapp.com",
  databaseURL: "https://my-friend-hub-default-rtdb.asia-southeast1.firebasestorage.app",
  projectId: "my-friend-hub",
  storageBucket: "my-friend-hub.firebasestorage.app",
  messagingSenderId: "1084141933087",
  appId: "1:1084141933087:web:1ae757acdd37a9c8427b2a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const loginScreen = document.getElementById("adminLoginScreen");
const dashboard = document.getElementById("adminDashboard");

// Admin Login
document.getElementById("adminLoginBtn").addEventListener("click", () => {
  signInWithPopup(auth, new GoogleAuthProvider()).catch(err => alert("Login Error: " + err.message));
});

document.getElementById("adminLogoutBtn").addEventListener("click", () => signOut(auth));

// Admin Auth State Check
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Optional: You can restrict admin email here if needed (e.g., if(user.email !== 'your-admin@gmail.com') { alert('Unauthorized'); signOut(auth); return; })
    loginScreen.style.display = "none";
    dashboard.style.display = "flex";
    document.getElementById("adminName").textContent = user.displayName;

    loadAllBookings();
    loadAdminCars();
  } else {
    loginScreen.style.display = "flex";
    dashboard.style.display = "none";
  }
});

// Load All Bookings for Admin
function loadAllBookings() {
  onValue(ref(db, 'bookings'), (snap) => {
    const tbody = document.getElementById("adminBookingsTable");
    tbody.innerHTML = "";
    const bookings = snap.val() || {};

    const sorted = Object.entries(bookings).sort((a,b) => b[1].timestamp - a[1].timestamp);

    if(sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#878787;">No bookings found.</td></tr>`;
      return;
    }

    sorted.forEach(([key, b]) => {
      tbody.innerHTML += `
        <tr>
          <td>
            <strong>${b.userName}</strong><br>
            <span style="font-size:12px; color:#878787;">📞 ${b.userPhone}</span>
          </td>
          <td>${b.carName}</td>
          <td>
            <span style="font-size:12px;">From: <strong>${b.pickupLocation}</strong></span><br>
            <span style="font-size:12px;">To: <strong>${b.dropLocation}</strong></span>
          </td>
          <td><span class="status-badge status-${b.status}">${b.status}</span></td>
          <td>
            <div class="action-btn-group">
              <button class="btn-approve" onclick="updateBookingStatus('${key}', 'confirmed')">Approve</button>
              <button class="btn-reject" onclick="updateBookingStatus('${key}', 'cancelled')">Cancel</button>
            </div>
          </td>
        </tr>
      `;
    });
  });
}

// Update Booking Status
window.updateBookingStatus = async (bookingId, newStatus) => {
  await update(ref(db, 'bookings/' + bookingId), { status: newStatus });
};

// Add New Car Form Submit
document.getElementById("addCarForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newCar = {
    name: document.getElementById("carNameInput").value.trim(),
    price: document.getElementById("carPriceInput").value.trim(),
    image: document.getElementById("carImgInput").value.trim(),
    seats: document.getElementById("carSeatsInput").value.trim(),
    ac: document.getElementById("carAcInput").value.trim(),
    fuel: document.getElementById("carFuelInput").value.trim(),
    quantity: document.getElementById("carQuantityInput") ? document.getElementById("carQuantityInput").value : document.getElementById("carQtyInput").value.trim()
  };

  try {
    await push(ref(db, 'cars'), newCar);
    alert("🚗 Car added successfully!");
    document.getElementById("addCarForm").reset();
  } catch(err) {
    alert("Error adding car: " + err.message);
  }
});

// Load Cars in Admin Fleet
function loadAdminCars() {
  onValue(ref(db, 'cars'), (snap) => {
    const grid = document.getElementById("adminCarsGrid");
    grid.innerHTML = "";
    const cars = snap.val() || {};

    for (const [key, car] of Object.entries(cars)) {
      grid.innerHTML += `
        <div class="admin-car-card">
          <img src="${car.image}" alt="Car">
          <h4>${car.name}</h4>
          <p>₹${car.price}/day | Stock: ${car.quantity}</p>
          <button class="btn-delete" onclick="deleteCar('${key}')">Remove Car</button>
        </div>
      `;
    }
  });
}

// Delete Car from Fleet
window.deleteCar = async (carId) => {
  if(confirm("Are you sure you want to delete this car?")) {
    await remove(ref(db, 'cars/' + carId));
  }
};