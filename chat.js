const form = document.querySelector("#chat-form");
const input = document.querySelector("#chat-input");
const messagesElement = document.querySelector("#chat-messages");
const statusElement = document.querySelector("#chat-status");
const submitButton = form.querySelector("button");
const promptButtons = document.querySelectorAll("[data-prompt]");

const conversation = [];
const MAX_TURNS = 6;

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    document.querySelector("#ask").scrollIntoView({ behavior: "smooth" });
    input.focus();
  });
});

function addMessage(text, role) {
  const wrapper = document.createElement("div");
  const paragraph = document.createElement("p");

  wrapper.className = `chat-message ${role}-message`;
  paragraph.textContent = text;
  wrapper.appendChild(paragraph);
  messagesElement.appendChild(wrapper);
  messagesElement.scrollTop = messagesElement.scrollHeight;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message || submitButton.disabled) return;

  addMessage(message, "user");
  conversation.push({ role: "user", text: message });
  input.value = "";
  submitButton.disabled = true;
  statusElement.textContent = "Morrow Works is considering your question…";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation.slice(-MAX_TURNS * 2) }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");

    addMessage(data.reply, "assistant");
    conversation.push({ role: "assistant", text: data.reply });
    statusElement.textContent = "AI-generated answers may be incomplete. Do not submit private information.";
  } catch (error) {
    addMessage(error.message, "assistant");
    statusElement.textContent = "The connection is not ready. Please try again shortly.";
  } finally {
    submitButton.disabled = false;
    input.focus();
  }
});
