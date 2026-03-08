const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email templates
const getAdminEmailTemplate = (data) => {
  const serviceTypeLabels = {
    cleaning: "Cleaning",
    landscaping: "Landscaping",
    "pressure-washing": "Pressure Washing",
    hvac: "HVAC",
    handyman: "Handyman",
    "auto-detailing": "Mobile Auto Detailing",
    contractor: "Contractor",
    other: "Other",
  };

  const domainLabels = {
    yes: "Yes, I have a domain",
    no: "No, I need help with this",
    unsure: "Not sure what this means",
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Consultation Request - Hillview Group</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #5B2EFF 0%, #3D1E8C 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
            .header p { color: #E5E7EB; margin: 10px 0 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .info-box { background-color: #f9fafb; border-left: 4px solid #5B2EFF; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
            .info-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; font-weight: 600; }
            .info-value { font-size: 16px; color: #111827; font-weight: 500; }
            .message-box { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .message-text { color: #374151; line-height: 1.6; font-size: 15px; }
            .footer { background-color: #1F1B3A; padding: 30px; text-align: center; }
            .footer p { color: #9CA3AF; margin: 0; font-size: 14px; }
            .badge { display: inline-block; background-color: #5B2EFF; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 10px; }
            .timestamp { text-align: center; color: #9CA3AF; font-size: 14px; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <span class="badge">NEW REQUEST</span>
                <h1>Consultation Request</h1>
                <p>A new potential client has submitted the booking form</p>
            </div>
            
            <div class="timestamp">
                Received on ${new Date().toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            
            <div class="content">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="info-box">
                        <div class="info-label">Full Name</div>
                        <div class="info-value">${data.fullName}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">Business Name</div>
                        <div class="info-value">${data.businessName || "N/A"}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="info-box">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">${data.email}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">Phone Number</div>
                        <div class="info-value">${data.phone || "N/A"}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="info-box">
                        <div class="info-label">Service Type</div>
                        <div class="info-value">${serviceTypeLabels[data.serviceType] || data.serviceType || "N/A"}</div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-label">Domain Status</div>
                        <div class="info-value">${domainLabels[data.hasDomain] || data.hasDomain || "N/A"}</div>
                    </div>
                </div>

                <div class="message-box">
                    <div class="info-label">Project Details & Message</div>
                    <div class="message-text">${data.message.replace(/\n/g, "<br>")}</div>
                </div>
            </div>
            
            <div class="footer">
                <p>© 2024 Hillview Group, Inc. | Admin Notification System</p>
                <p style="margin-top: 10px; font-size: 12px;">service@hillviewgroupinc.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const getCustomerEmailTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You - Hillview Group</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #5B2EFF 0%, #3D1E8C 100%); padding: 40px 30px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
            .logo-text { color: #5B2EFF; font-weight: 800; font-size: 24px; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 20px; color: #111827; margin-bottom: 20px; font-weight: 600; }
            .message { color: #374151; line-height: 1.7; font-size: 16px; margin-bottom: 30px; }
            .what-next { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; }
            .what-next h3 { color: #5B2EFF; margin: 0 0 15px 0; font-size: 18px; }
            .step { display: flex; align-items: flex-start; margin-bottom: 15px; }
            .step-number { background: linear-gradient(135deg, #5B2EFF, #8B5CF6); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 15px; flex-shrink: 0; }
            .step-text { color: #374151; font-size: 15px; padding-top: 3px; }
            .cta-box { background: linear-gradient(135deg, #5B2EFF 0%, #3D1E8C 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .cta-box h3 { color: #ffffff; margin: 0 0 10px 0; font-size: 20px; }
            .cta-box p { color: #E5E7EB; margin: 0; font-size: 15px; }
            .contact-info { text-align: center; margin: 30px 0; }
            .contact-info p { color: #6B7280; margin: 5px 0; font-size: 15px; }
            .contact-info a { color: #5B2EFF; text-decoration: none; font-weight: 600; }
            .footer { background-color: #1F1B3A; padding: 30px; text-align: center; }
            .footer p { color: #9CA3AF; margin: 0; font-size: 14px; }
            .social-links { margin-top: 20px; }
            .social-links a { color: #8B5CF6; text-decoration: none; margin: 0 10px; font-size: 14px; }
            .divider { height: 1px; background: linear-gradient(90deg, transparent, #5B2EFF, transparent); margin: 30px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-text">Hillview Group</div>
                <h1>Thank You for Reaching Out!</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hi ${data.fullName.split(" ")[0]},</div>
                
                <div class="message">
                    We've received your consultation request and we're excited to help you build a professional online presence for your business.
                </div>
                
                <div class="what-next">
                    <h3>📋 What Happens Next?</h3>
                    
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-text">Our team will review your request within the next 24 hours</div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-text">We'll send you an email to schedule your free 15-minute consultation</div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-text">During the call, we'll discuss your goals and provide a custom quote</div>
                    </div>
                </div>
                
                <div class="cta-box">
                    <h3>Questions Before We Call?</h3>
                    <p>Feel free to reply to this email or contact us directly</p>
                </div>
                
                <div class="contact-info">
                    <p><strong>Email:</strong> <a href="mailto:service@hillviewgroupinc.com">service@hillviewgroupinc.com</a></p>
                    <p style="margin-top: 10px; font-size: 13px; color: #9CA3AF;">Typical response time: Within 24 hours</p>
                </div>
                
                <div class="divider"></div>
                
                <div style="text-align: center; color: #6B7280; font-size: 14px;">
                    <p>We look forward to helping you grow your business!</p>
                    <p style="margin-top: 10px; font-weight: 600; color: #5B2EFF;">— The Hillview Group Team</p>
                </div>
            </div>
            
            <div class="footer">
                <p>© 2024 Hillview Group, Inc. All rights reserved.</p>
                <p style="margin-top: 10px; font-size: 12px;">Professional websites for local trade businesses</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Validation rules
const validateContact = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters"),
  body("businessName").optional().trim(),
  body("phone").optional().trim(),
  body("serviceType").optional().trim(),
  body("hasDomain").optional().trim(),
  // Note: In production, you should verify reCAPTCHA here as well
];

// Contact form endpoint
app.post("/api/contact", validateContact, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      fullName,
      businessName,
      email,
      phone,
      serviceType,
      hasDomain,
      message,
      recaptchaToken,
    } = req.body;

    // Verify reCAPTCHA (optional but recommended)
    // if (recaptchaToken) {
    //     // Verify with Google reCAPTCHA API
    // }

    // Create transporter (configure based on your email provider)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // your email
        pass: process.env.SMTP_PASS, // your password or app-specific password
      },
      tls: {
        rejectUnauthorized: false, // only for development, remove in production
      },
    });

    // Verify connection configuration
    await transporter.verify();
    console.log("SMTP connection verified successfully");

    // Send email to Admin
    const adminMailOptions = {
      from: `"Hillview Group Website" <${process.env.SMTP_USER}>`,
      to: "service@hillviewgroupinc.com",
      subject: `🔔 New Consultation Request - ${fullName}`,
      html: getAdminEmailTemplate({
        fullName,
        businessName,
        email,
        phone,
        serviceType,
        hasDomain,
        message,
      }),
      replyTo: email, // Allow admin to reply directly to customer
    };

    // Send email to Customer
    const customerMailOptions = {
      from: `"Hillview Group, Inc." <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank You! We Received Your Request 🚀",
      html: getCustomerEmailTemplate({
        fullName,
        businessName,
        email,
        phone,
        serviceType,
        hasDomain,
        message,
      }),
    };

    // Send both emails
    const [adminResult, customerResult] = await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions),
    ]);

    console.log("Admin email sent:", adminResult.messageId);
    console.log("Customer email sent:", customerResult.messageId);

    // Log submission (you could also save to database here)
    console.log("Form submission:", {
      timestamp: new Date().toISOString(),
      fullName,
      email,
      businessName,
      serviceType,
    });

    res.status(200).json({
      success: true,
      message:
        "Form submitted successfully! We will contact you within 24 hours.",
      data: {
        messageId: customerResult.messageId,
      },
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({
      success: false,
      message:
        "Something went wrong. Please try again or contact us directly at service@hillviewgroupinc.com",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📧 Email service configured for: ${process.env.SMTP_USER || "Not configured"}`,
  );
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/contact`);
});

module.exports = app;
