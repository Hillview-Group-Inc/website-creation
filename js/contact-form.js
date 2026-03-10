// API Configuration
const API_BASE_URL = "https://hvgweb.com"; // "https://orange-sea-03d42eb0f.2.azurestaticapps.net"; //"http://localhost:3000"; // Development URL when local testing

// Contact Form Handling
document
  .getElementById("contact-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submit-btn");
    const btnText = document.getElementById("btn-text");
    const btnIcon = document.getElementById("btn-icon");
    const successMessage = document.getElementById("success-message");
    const form = this;

    // Validate required fields
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!fullName || !email || !message) {
      alert(
        "Please fill in all required fields (Full Name, Email, and Message).",
      );
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.textContent = "Sending...";
    btnIcon.setAttribute("data-lucide", "loader-2");
    btnIcon.classList.add("animate-spin");
    lucide.createIcons();

    // Collect form data
    const formData = {
      fullName: fullName,
      businessName: document.getElementById("businessName").value.trim(),
      email: email,
      phone: document.getElementById("phone").value.trim(),
      serviceType: document.getElementById("serviceType").value,
      hasDomain: document.getElementById("hasDomain").value,
      message: message,
      recaptchaToken: grecaptcha.getResponse(), // Get reCAPTCHA response if implemented
    };

    try {
      // Send data to backend API
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success message
        successMessage.classList.add("show");
        form.reset();
        if (typeof grecaptcha !== "undefined") {
          grecaptcha.reset();
        }

        // Scroll to success message
        successMessage.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Log success (for debugging)
        console.log("Form submitted successfully:", result);

        // Optional: Track conversion (add your analytics here)
        // gtag('event', 'form_submission', { ... });
      } else {
        // Show error message from server
        throw new Error(
          result.message || "Something went wrong. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        error.message ||
          "Failed to submit form. Please try again or contact us directly at service@hillviewgroupinc.com",
      );
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      btnText.textContent = "Request My Starter Website";
      btnIcon.setAttribute("data-lucide", "arrow-right");
      btnIcon.classList.remove("animate-spin");
      lucide.createIcons();
    }
  });

// Optional: Test API connection on page load
// window.addEventListener("load", async () => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/health`);
//     if (response.ok) {
//       console.log("✅ Backend API is connected and running");
//     }
//   } catch (error) {
//     console.warn(
//       "⚠️ Backend API not reachable. Make sure the server is running on " +
//         API_BASE_URL,
//     );
//   }
// });
