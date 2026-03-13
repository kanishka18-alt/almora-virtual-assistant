// ================== script.js ==================

const button = document.querySelector('#btn');
const content = document.querySelector('#content');
const sendButton = document.querySelector('#send');
const userInput = document.querySelector('#userInput');
const messagesContainer = document.getElementById('messages');
const voiceGif = document.getElementById('voiceGif'); // 🎤 Voice GIF

// Backend URL
const BACKEND_URL = "http://127.0.0.1:3000/chat";

// ----------------- Text-to-Speech -----------------
function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(voice =>
    voice.name.toLowerCase().includes("female") ||
    voice.name.toLowerCase().includes("woman") ||
    voice.name.toLowerCase().includes("zira") ||
    voice.name.toLowerCase().includes("samantha")
  );
  if (femaleVoice) utterance.voice = femaleVoice;

  window.speechSynthesis.speak(utterance);
}

// ----------------- Add message -----------------
function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add("message", sender === "user" ? "user" : "bot");
  msg.innerHTML = text; // allow HTML
  messagesContainer.appendChild(msg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ----------------- Quick commands -----------------
function takeCommand(message) {
  message = message.toLowerCase();

  if (message.includes("hello") || message.includes("hi")) {
    return respond("Hello! How can I help you today?");
  } else if (message.includes("your name") || message.includes("who are you")) {
    return respond("I am Almora, your virtual assistant and friend.");
  } else if (message.includes("how are you")) {
    return respond("I’m doing great! How about you?");
  } else if (message.includes("time")) {
    return respond("The time is " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  } else if (message.includes("date")) {
    return respond("Today's date is " + new Date().toLocaleDateString());
  } else if (message.includes("open youtube")) return openSite("YouTube", "https://www.youtube.com");
  else if (message.includes("open google")) return openSite("Google", "https://www.google.com");
  else if (message.includes("open instagram")) return openSite("Instagram", "https://www.instagram.com");
  else if (message.includes("open chatgpt")) return openSite("ChatGPT", "https://www.chatgpt.com");
  else if (message.includes("open netflix")) return openSite("Netflix", "https://www.netflix.com");

  return false;
}

// Helper to open websites
function openSite(name, url) {
  respond(`Opening ${name}`);
  window.open(url, "_blank");
  return true;
}

// Helper for quick response
function respond(text) {
  addMessage("bot", text);
  speak(text);
  return true;
}

// ----------------- Send message -----------------
async function sendMessage(message) {
  if (!message.trim()) return;

  addMessage("user", message);
  userInput.value = "";

  if (takeCommand(message)) return;

  // Handle Google search commands
  if (message.toLowerCase().startsWith("search ")) {
    const query = message.replace("search ", "").trim();
    return searchGoogle(query);
  }

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (Array.isArray(data.reply)) {
      let responseHTML = data.reply.map(item =>
        `<p><b>${item.title}</b><br>${item.snippet}<br>
         <a href="${item.link}" target="_blank">${item.link}</a></p>`
      ).join("<hr>");
      addMessage("bot", responseHTML);
      speak(data.reply[0]?.snippet || "");
    } else if (data.reply) {
      addMessage("bot", data.reply);
      speak(data.reply);
    } else {
      addMessage("bot", "⚠️ No reply from Almora.");
    }

  } catch (err) {
    console.error("Fetch error:", err);
    addMessage("bot", "❌ Error connecting to server.");
  }
}

// ----------------- Google Search -----------------
async function searchGoogle(query) {
  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query })
    });

    const data = await res.json();

    if (Array.isArray(data.reply)) {
      let responseHTML = data.reply.map(item =>
        `<p><b>${item.title}</b><br>${item.snippet}<br>
         <a href="${item.link}" target="_blank">${item.link}</a></p>`
      ).join("<hr>");
      addMessage("bot", responseHTML);
      speak(data.reply[0]?.snippet || "");
    } else if (data.reply) {
      addMessage("bot", data.reply);
      speak(data.reply);
    } else {
      addMessage("bot", "⚠️ No search results found.");
    }
  } catch (err) {
    console.error("Google Search error:", err);
    addMessage("bot", "❌ Error fetching search results.");
  }
}

// ----------------- Voice input -----------------
button.addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();
  voiceGif.style.display = "block";

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    addMessage("user", spokenText);
    sendMessage(spokenText);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    voiceGif.style.display = "none";
  };

  recognition.onend = () => {
    voiceGif.style.display = "none";
  };
});

// ----------------- Send button & Enter key -----------------
sendButton.addEventListener('click', () => sendMessage(userInput.value));
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage(userInput.value);
});

