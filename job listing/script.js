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
  deleteDoc, 
  serverTimestamp 
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
import { browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

setPersistence(auth, browserLocalPersistence).catch((error) => {
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

// Function to format timestamp
function toDateTime(timestamp) {
  if (!timestamp) return "Unknown";
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = String(date.getFullYear()); // Get last 2 digits of the year
  return `${day}/${month}/${year}`;
}


/* ----- PUBLIC JOB LISTINGS PAGE (index.html) ----- */
if (document.getElementById("jobListings")) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Admin is logged in — show Add Job button
      document.getElementById("adminActions").style.display = "block";
      document.getElementById("publicLogin").style.display = "none";
    }
  });
  let jobs = [];
  let filteredJobs = [];
  let currentPage = 1;
  const jobsPerPage = 10;

  // Inject Search Bar into DOM
  const jobListingsSection = document.getElementById("jobListings");
  const searchBar = document.createElement("div");
  searchBar.innerHTML = `
    <input type="text" id="jobSearchInput" placeholder="Search jobs..." class="job-search-input">
  `;
  jobListingsSection.parentNode.insertBefore(searchBar, jobListingsSection);

  document.addEventListener("input", (e) => {
    if (e.target.id === "jobSearchInput") {
      const searchTerm = e.target.value.toLowerCase();
      filteredJobs = jobs.filter((job) => {
        return (
          job.title?.toLowerCase().includes(searchTerm) ||
          job.location?.toLowerCase().includes(searchTerm) ||
          job.experience?.toLowerCase().includes(searchTerm) ||
          job.salary?.toLowerCase().includes(searchTerm)
        );
      });
      currentPage = 1;
      displayJobs();
    }
  });

  async function loadPublicJobs() {
    const jobListings = document.getElementById("jobListings");
    jobListings.innerHTML = "<p class='loading-text'>Loading jobs...</p>";

    try {
      const querySnapshot = await getDocs(collection(db, "jobs"));
      jobs = [];

      querySnapshot.forEach((docSnap) => {
        let jobData = docSnap.data();
        jobs.push({ id: docSnap.id, ...jobData });
      });

      // Sort by newest
      jobs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      filteredJobs = [...jobs]; // initialize filteredJobs
      displayJobs();
    } catch (error) {
      console.error("Error loading public jobs:", error);
    }
  }

  function displayJobs() {
    const jobListings = document.getElementById("jobListings");
    const pageNumber = document.getElementById("pageNumber");
    const prevPage = document.getElementById("prevPage");
    const nextPage = document.getElementById("nextPage");

    jobListings.innerHTML = "";

    const start = (currentPage - 1) * jobsPerPage;
    const end = start + jobsPerPage;
    const paginatedJobs = filteredJobs.slice(start, end);

    if (paginatedJobs.length === 0) {
      jobListings.innerHTML = `<p class="loading-text">No jobs found.</p>`;
    } else {
      paginatedJobs.forEach((jobData) => {
        jobListings.innerHTML += `
          <div class="job">
            <p><strong>Title:</strong> ${jobData.title}</p>
            <p><strong>Location:</strong> ${jobData.location}</p>
            <p><strong>Experience:</strong> ${jobData.experience}</p>
            <p><strong>Salary:</strong> ${jobData.salary}</p>
            <p><strong>Posted On:</strong> ${toDateTime(jobData.timestamp)}</p>
            <a href="${jobData.link}" target="_blank"><button>Go to Job</button></a>
          </div>
        `;
      });
    }

    pageNumber.textContent = `Page ${currentPage}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = end >= filteredJobs.length;
  }

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      displayJobs();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage * jobsPerPage < filteredJobs.length) {
      currentPage++;
      displayJobs();
    }
  });

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
      let jobs = [];
  
      querySnapshot.forEach((docSnap) => {
        let jobData = docSnap.data();
        jobs.push({ id: docSnap.id, ...jobData });
      });
  
      // Sort jobs from newest to oldest
      jobs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  
      jobs.forEach((jobData) => {
        jobListingsAdmin.innerHTML += `
          <div class="job">
            <p><strong>Job ID:</strong> ${jobData.id}</p>
            <p><strong>Title:</strong> ${jobData.title}</p>
            <p><strong>Location:</strong> ${jobData.location}</p>
            <p><strong>Experience:</strong> ${jobData.experience}</p>
            <p><strong>Salary:</strong> ${jobData.salary}</p>
            <p><strong>Posted On:</strong> ${toDateTime(jobData.timestamp)}</p>
            <a href="${jobData.link}" target="_blank"><button>Go to Job</button></a>
            <button class="delete-job" data-id="${jobData.id}">Delete Job</button>
          </div>
        `;
      });
  
      // Add event listeners for delete buttons
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
        await addDoc(collection(db, "jobs"), { 
          title, 
          location, 
          experience, 
          salary, 
          link,
          timestamp: serverTimestamp() 
        });
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
``