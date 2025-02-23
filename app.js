const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

function toggleSidebar () {
  sidebar.classList.toggle('close');
}



document.getElementById("billForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const scenario = document.getElementById("scenario").value;
  const primaryPrev = parseFloat(document.getElementById("primaryPrev").value);
  const primaryCurrent = parseFloat(document.getElementById("primaryCurrent").value);
  const totalBill = parseFloat(document.getElementById("totalBill").value);
  const submeterInputs = document.querySelectorAll(".submeter");
  const resultsDiv = document.getElementById("resultsDiv");
  const pdfContent = document.getElementById("pdfContent");

  if (isNaN(primaryPrev) || isNaN(primaryCurrent) || isNaN(totalBill)) {
      alert("Please enter valid numbers in all fields.");
      return;
  }

  if (primaryCurrent < primaryPrev) {
      alert("Present reading cannot be lower than previous reading.");
      return;
  }

  const totalKWH = primaryCurrent - primaryPrev;
  if (totalKWH === 0) {
      alert("Invalid readings: Total kWh cannot be zero.");
      return;
  }

  const amountPerKWH = totalBill / totalKWH;
  let totalSubmeterKWH = 0;
  let submeters = [];

  submeterInputs.forEach((input, index) => {
      const prev = parseFloat(input.querySelector(".prev").value);
      const current = parseFloat(input.querySelector(".current").value);
      if (!isNaN(prev) && !isNaN(current) && current >= prev) {
          const kwh = current - prev;
          submeters.push({ kwh, element: input, index });
          totalSubmeterKWH += kwh;
      }
  });

  if (totalSubmeterKWH > totalKWH) {
      resultsDiv.innerHTML = "<p style='color: red;'><strong>Error:</strong> Total submeter kWh exceeds primary meter kWh. Please check your readings.</p>";
      return;
  }

  let results = "<h2>Electricity Bill Report</h2><h3>Results:</h3>";
  let remainingBill = totalBill;

  if (scenario === "individual") {
      const primaryBill = remainingBill - (totalSubmeterKWH * amountPerKWH);
      results += `<p><strong>Primary Meter / House 1:</strong><br> Total kWh Used: ${totalKWH} kWh<br>Bill: ₱${primaryBill.toFixed(2)}</p>`;
      
      submeters.forEach(({ kwh, element, index }) => {
          const bill = kwh * amountPerKWH;
          element.querySelector(".bill").innerText = `₱${bill.toFixed(2)}`;
          results += `<p><strong>Submeter ${index + 1} / House ${index + 2}:</strong><br>Total kWh Used: ${kwh} kWh<br>Bill: ₱${bill.toFixed(2)}</p>`;
      });
  } 
  else if (scenario === "shared") {
      let totalSubmeterCost = 0;
      submeters.forEach(({ kwh }) => {
          totalSubmeterCost += kwh * amountPerKWH;
      });
      remainingBill -= totalSubmeterCost;
      let sharedCost = remainingBill / submeters.length;
      
      submeters.forEach(({ kwh, element, index }) => {
          const bill = kwh * amountPerKWH + sharedCost;
          element.querySelector(".bill").innerText = `₱${bill.toFixed(2)}`;
          results += `<p><strong>Submeter ${index + 1} / House ${index + 1}:</strong><br>Total kWh Used: ${kwh} kWh<br>Bill: ₱${bill.toFixed(2)}</p>`;
      });
      
      results += `<p><strong>Each Submeter's Share of Remaining Bill:</strong> ₱${sharedCost.toFixed(2)}</p>`;
  }

  pdfContent.innerHTML = results;
  resultsDiv.innerHTML = results + `<button id="downloadResults">Download Results</button>`;

  document.getElementById("downloadResults").addEventListener("click", function() {
      html2pdf().from(pdfContent).save("Electricity_Bill_Report.pdf");
  });
});

document.getElementById("addSubmeter").addEventListener("click", function() {
  const container = document.getElementById("submeterContainer");
  const div = document.createElement("div");
  div.classList.add("submeter");
  div.innerHTML = `
      <label>Previous Reading:</label>
      <input type="number" class="prev" required>
      <label>Present Reading:</label>
      <input type="number" class="current" required>
      <p>Bill: <span class="bill">₱0.00</span></p>
  `;
  container.appendChild(div);
});

document.getElementById("resetBtn").addEventListener("click", function() {
  document.getElementById("billForm").reset();
  document.getElementById("resultsDiv").innerHTML = "";
  document.getElementById("submeterContainer").innerHTML = "";
  document.getElementById("pdfContent").innerHTML = "";
});

require('dotenv').config(); // Load .env variables

$(document).ready(function () {
    const API_KEY = process.env.API_KEY; 
  $("#send").click(function () {
      sendMessage();
  });

  // Send message when pressing "Enter"
  $("#text").keypress(function (event) {
      if (event.which === 13) {
          sendMessage();
      }
  });

  // Open file input when clicking the attachment button
  $("#attachment").click(function () {
      $("#fileInput").click();
  });

  // Handle file selection
  $("#fileInput").change(function () {
      const file = this.files[0];
      if (file) {
          appendMessage("user", "📎 Attachment: " + file.name);
      }
  });

  // Handle "How the Calculation Works" button
  $("#howCalculationWorks").click(function () {
      const explanation = "**⚡ How the Electricity Calculation Works:**\n\n" +
          "🔹 **1️⃣ Separate House Billing (Per House Calculation)**\n" +
          "   - **Step 1:** Compute the total kWh used by the **Primary Meter**:\n" +
          "     📌 `Primary Present Reading - Primary Previous Reading`\n" +
          "   - **Step 2:** Compute the kWh used by each **Submeter**:\n" +
          "     📌 `Submeter Present Reading - Submeter Previous Reading`\n" +
          "   - **Step 3:** Compute the **Cost per kWh**:\n" +
          "     📌 `Total Bill of Primary Meter ÷ Total kWh Used of Primary Meter`\n" +
          "   - **Step 4:** Compute the **Submeter Bill (Peso)**:\n" +
          "     📌 `Cost per kWh × kWh Used by Submeter`\n\n" +
          "🔹 **2️⃣ Household Cost Sharing (Splitting Among Tenants in One House)**\n" +
          "   - **Method 1: Equal Share**\n" +
          "     📌 `Total House Bill ÷ Number of Tenants`\n" +
          "   - **Method 2: Individual Metered Usage**\n" +
          "     📌 `(Tenant kWh ÷ House kWh) × Total House Bill`\n\n" +
          "💡 *This ensures a fair and transparent cost-sharing system!*";

      appendMessage("model", explanation);
  });

  // Function to send user input
  function sendMessage() {
      const userMessage = $("#text").val().trim();
      if (userMessage !== "") {
          appendMessage("user", userMessage);
          $("#text").val(""); // Clear input field
          fetchGeminiResponse(userMessage);
      }
  }

  // Function to append messages to chat
  function appendMessage(sender, text) {
      const messageContainer = $("#chatContainer");
      const messageDiv = $("<div>").addClass("message " + sender);
      const messageBody = $("<div>").addClass("msg-body").text(text);

      messageDiv.append(messageBody);
      messageContainer.append(messageDiv);
      messageContainer.scrollTop(messageContainer.prop("scrollHeight"));
  }

  // Function to call Gemini AI API
  async function fetchGeminiResponse(userInput) {
      try {
          const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + API_KEY, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  contents: [{ role: "user", parts: [{ text: userInput }] }]
              })
          });

          const data = await response.json();
          const botReply = data.candidates[0].content.parts[0].text || "🤖 I couldn't understand that.";

          appendMessage("model", botReply);
      } catch (error) {
          appendMessage("model", "❌ Error: Unable to fetch response.");
          console.error("Error fetching Gemini AI response:", error);
      }
  }
});
