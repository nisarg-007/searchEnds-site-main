import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserSessionPersistence, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeDC0bbIVj8lY57LbCCjA-Io5CRY0QpWA",
  authDomain: "searchends-40437.firebaseapp.com",
  projectId: "searchends-40437",
  storageBucket: "searchends-40437.firebasestorage.app",
  messagingSenderId: "52996007980",
  appId: "1:52996007980:web:48f8a0fa5deb44c73a8989",
  measurementId: "G-VL943YRHL6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to session (login remains until tab/browser is closed)
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

// Function to display toast notifications
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `toast-notification ${type}`;
  notification.innerText = message;

  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/* ----- PUBLIC JOB LISTINGS PAGE (index.html) ----- */
if (document.getElementById("jobListings") && !document.getElementById("loginForm") && !document.getElementById("adminPanel")) {
  async function loadPublicJobs() {
    const jobListings = document.getElementById("jobListings");
    jobListings.innerHTML = "";
    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      querySnapshot.forEach((docSnap) => {
        const jobData = docSnap.data();
        jobListings.innerHTML += `
          <div class="job">
            <p><strong>Job ID:</strong> ${docSnap.id}</p>
            <p><strong>Title:</strong> ${jobData.title}</p>
            <p><strong>Location:</strong> ${jobData.location}</p>
            <p><strong>Experience:</strong> ${jobData.experience}</p>
            <p><strong>Salary:</strong> ${jobData.salary}</p>
            <a href="${jobData.link}" target="_blank"><button>Go to Job</button></a>
          </div>
        `;
      });
    } catch (error) {
      console.error("Error loading public jobs:", error);
    }
  }
  loadPublicJobs();
}

/* ----- LOGIN PAGE LOGIC (login.html) ----- */
if (document.getElementById("loginForm")) {
  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification("Login successful!", "success");
      window.location.href = "admin.html";
    } catch (error) {
      showNotification("Login failed: " + error.message, "error");
    }
  });
}

/* ----- ADMIN PANEL PAGE LOGIC (admin.html) ----- */
if (document.getElementById("adminPanel")) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      loadAdminJobs();
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        showNotification("Logged out successfully!", "success");
        window.location.href = "login.html";
      } catch (error) {
        showNotification("Logout error: " + error.message, "error");
      }
    });
  }

  async function loadAdminJobs() {
    const jobListingsAdmin = document.getElementById("jobListingsAdmin");
    jobListingsAdmin.innerHTML = "";
  
    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      querySnapshot.forEach((docSnap) => {
        const jobData = docSnap.data();
        jobListingsAdmin.innerHTML += `
          <div class="job">
            <p><strong>Job ID:</strong> ${docSnap.id}</p>
            <p><strong>Title:</strong> ${jobData.title}</p>
            <p><strong>Location:</strong> ${jobData.location}</p>
            <p><strong>Experience:</strong> ${jobData.experience}</p>
            <p><strong>Salary:</strong> ${jobData.salary}</p>
            <a href="${jobData.link}" target="_blank"><button>Go to Job</button></a>
            <button class="delete-job" data-id="${docSnap.id}">Delete Job</button>
          </div>
        `;
      });
  
      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-job").forEach(button => {
        button.addEventListener("click", () => {
          const jobId = button.getAttribute("data-id");
          if (confirm("Are you sure you want to delete this job?")) {
            deleteJob(jobId);
          }
        });
      });
  
    } catch (error) {
      console.error("Error loading admin jobs:", error);
    }
  }
  

  const addJobForm = document.getElementById("addJobForm");
  if (addJobForm) {
    addJobForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("jobTitle").value.trim();
      const location = document.getElementById("location").value.trim();
      const experience = document.getElementById("experience").value.trim();
      const salary = document.getElementById("salary").value.trim();
      const link = document.getElementById("jobLink").value.trim();
      if (!title || !location || !experience || !salary || !link) {
        showNotification("Please fill in all fields.", "warning");
        return;
      }
      try {
        await addDoc(collection(db, "jobs"), { title, location, experience, salary, link });
        showNotification("Job added successfully!", "success");
        addJobForm.reset();
        loadAdminJobs();
      } catch (error) {
        showNotification("Error adding job: " + error.message, "error");
      }
    });
  }
  

async function deleteJob(jobId) {
  if (!jobId) {
    showNotification("Invalid Job ID.", "error");
    return;
  }

  try {
    await deleteDoc(doc(db, "jobs", jobId));
    showNotification("Job deleted successfully!", "success");
    loadAdminJobs(); // Refresh job listings after deletion
  } catch (error) {
    showNotification("Error deleting job: " + error.message, "error");
  }
}

}
