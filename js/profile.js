import { startSpeechToText, captureImage, base64ToBlob } from "./utils.js";

function onFirebaseReady(cb) {
    if (window.auth && window.db) return cb();
    window.addEventListener("firebaseReady", cb);
}

onFirebaseReady(() => {

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            location.href = "index.html";
            return;
        }

        const uid = user.uid;
        const userDoc = await db.collection("users").doc(uid).get();
        const data = userDoc.data();

        // Fill profile fields
        document.getElementById("profileUsername").value = data.username;
        document.getElementById("profileEmail").value = user.email;
        document.getElementById("profilePhone").value = data.phone || "";
        document.getElementById("profileLocation").value = data.location || "";
        document.getElementById("profileBio").value = data.about || "";
        document.getElementById("lostCount").textContent = data.lostCount || 0;
        document.getElementById("foundCount").textContent = data.foundCount || 0;

        if (data.photoURL) {
            document.getElementById("profileImgPreview").src = data.photoURL;
        } else {
            document.getElementById("profileImgPreview").src = "https://via.placeholder.com/150";
        }

        // File upload
        document.getElementById("profileImgFile").addEventListener("change", (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                document.getElementById("profileImgPreview").src = reader.result;
            };
            reader.readAsDataURL(file);
        });

        // Camera open
        const cameraBtn = document.getElementById("cameraBtn");
        const video = document.getElementById("cameraStream");
        const canvas = document.getElementById("cameraCanvas");
        const captureBtn = document.getElementById("capturePhotoBtn");

        cameraBtn.addEventListener("click", async () => {
            video.classList.remove("hidden");
            captureBtn.classList.remove("hidden");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
            video.srcObject = stream;
            video.play();
        });

        captureBtn.addEventListener("click", () => {
            const imgBase64 = captureImage("cameraStream", "cameraCanvas");
            document.getElementById("profileImgPreview").src = imgBase64;
            video.classList.add("hidden");
            captureBtn.classList.add("hidden");
        });

        // Voice to text
        document.getElementById("voiceBioBtn")
            .addEventListener("click", () => startSpeechToText("profileBio"));

        // Save Profile
        document.getElementById("saveProfileBtn").addEventListener("click", async () => {

            const username = document.getElementById("profileUsername").value;
            const phone = document.getElementById("profilePhone").value;
            const location = document.getElementById("profileLocation").value;
            const about = document.getElementById("profileBio").value;

            let photoURL = data.photoURL;

            const imgSrc = document.getElementById("profileImgPreview").src;

            // If new image is chosen
            if (!imgSrc.startsWith("http")) {
                const blob = base64ToBlob(imgSrc);
                const path = `profiles/${uid}/${Date.now()}`;
                const snap = await storage.ref(path).put(blob);
                photoURL = await snap.ref.getDownloadURL();
            }

            await db.collection("users").doc(uid).update({
                username, phone, location, about, photoURL
            });

            alert("Profile Updated Successfully!");
        });

        // Delete Account
        document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
            if (!confirm("Are you sure you want to DELETE your account permanently?")) return;

            await db.collection("users").doc(uid).delete();
            await auth.currentUser.delete();

            alert("Account Deleted.");
            location.href = "index.html";
        });

    });

});
