const API_KEY = "AIzaSyB7_39jR-kqbchHlKHzBtmWbtAbY8jrtbw";
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const payload = {
  system_instruction: {
    parts: [{ text: "Hello AI" }],
  },
  contents: [
    { role: "user", parts: [{ text: "Track my ride" }] }
  ]
};

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then(res => res.text().then(text => ({ status: res.status, text })))
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error("Fetch error:", err));
