// chat.js

function onFirebaseReady(callback) {
    if (window.auth && window.db) return callback();
    window.addEventListener("firebaseReady", callback);
}

onFirebaseReady(() => {

    auth.onAuthStateChanged(async (user) => {

        if (!user) {
            location.href = "index.html";
            return;
        }

        window.currentUser = user;

        // Extract chatId from URL
        const urlParams = new URLSearchParams(window.location.search);
        const chatId = urlParams.get("chatId");

        if (!chatId) {
            alert("Chat ID missing!");
            return;
        }

        const messagesDiv = document.getElementById("messages");
        const msgInput = document.getElementById("msgInput");
        const sendBtn = document.getElementById("sendBtn");

        // Load Messages (Realtime)
        db.collection("chats")
          .doc(chatId)
          .collection("messages")
          .orderBy("timestamp", "asc")
          .onSnapshot((snap) => {
            
            messagesDiv.innerHTML = ""; 

            snap.forEach((doc) => {
                const msg = doc.data();
                const isMine = msg.sender === currentUser.uid;

                const msgBubble = document.createElement("div");
                msgBubble.className = "max-w-[70%] p-3 rounded-xl text-sm";

                if (isMine) {
                    msgBubble.classList.add("ml-auto", "bg-green-600");
                } else {
                    msgBubble.classList.add("mr-auto", "bg-white/10");
                }

                msgBubble.innerHTML = `
                  <div>${msg.text}</div>
                  <div class="text-[10px] opacity-70 mt-1">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                `;

                messagesDiv.appendChild(msgBubble);
            });

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });

        // Send Message
        sendBtn.addEventListener("click", async () => {
            const text = msgInput.value.trim();
            if (text === "") return;

            msgInput.value = "";

            await db.collection("chats")
                    .doc(chatId)
                    .collection("messages")
                    .add({
                        text: text,
                        sender: currentUser.uid,
                        timestamp: Date.now()
                    });
        });

    });
});
