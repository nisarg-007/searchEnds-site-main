import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDKMW34GcOs_u0tYfpyopjhzPDox9rucJ8",
    authDomain: "searchends-24257.firebaseapp.com",
    projectId: "searchends-24257",
    storageBucket: "searchends-24257.firebasestorage.app",
    messagingSenderId: "871100522976",
    appId: "1:871100522976:web:0d8c9719b194ea72f10b85",
    measurementId: "G-7KSK8H81RY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Login Event
document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = prompt("Enter email:");
    const password = prompt("Enter password:");

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login successful!");
        document.getElementById("adminPanel").style.display = "block";
        loadJobs();
    } catch (error) {
        alert("Login failed: " + error.message);
    }
});

// Load Jobs from Firestore
async function loadJobs() {
    const jobsContainer = document.getElementById("jobListings");
    jobsContainer.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "jobs"));
    querySnapshot.forEach((doc) => {
        const jobData = doc.data();
        jobsContainer.innerHTML += `
            <div class='job'>
                <p><strong>Job ID:</strong> ${doc.id}</p>
                <p><strong>Title:</strong> ${jobData.title}</p>
                <p><strong>Location:</strong> ${jobData.location}</p>
                <p><strong>Experience:</strong> ${jobData.experience}</p>
                <p><strong>Salary:</strong> ${jobData.salary}</p>
                <a href="${jobData.link}" target="_blank"><button>Go to Job</button></a>
            </div>`;
    });
}

// Add Job to Firestore
document.getElementById("addJobForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevents default form submission

    const title = document.getElementById("jobTitle").value;
    const location = document.getElementById("location").value;
    const experience = document.getElementById("experience").value;
    const salary = document.getElementById("salary").value;
    const link = document.getElementById("jobLink").value;

    try {
        await addDoc(collection(db, "jobs"), { title, location, experience, salary, link });
        alert("Job added successfully!");
        document.getElementById("addJobForm").reset();
        loadJobs();
    } catch (error) {
        console.error("Error adding job: ", error);
    }
});

// Delete Job from Firestore
document.getElementById("deleteJobBtn").addEventListener("click", async () => {
    const jobId = document.getElementById("deleteJobId").value.trim();

    if (jobId === "") {
        alert("Please enter a Job ID to delete.");
        return;
    }

    try {
        await deleteDoc(doc(db, "jobs", jobId));
        alert("Job deleted successfully!");
        document.getElementById("deleteJobId").value = "";
        loadJobs();
    } catch (error) {
        alert("Error deleting job: " + error.message);
    }
});
