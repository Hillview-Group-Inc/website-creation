const { app } = require("@azure/functions");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const { buildCorsHeaders } = require("./_shared");

// Middleware
// const whitelist = ["https://hvgweb.com"];
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true); // allow non-browser requests like curl
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
// };

const CORS_METHODS = "POST, OPTIONS";

app.http("contact", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous", // or 'function', 'admin'
  handler: async (request, context) => {
    context.log("HTTP trigger function processed a request.");
    // Use your existing logic from server.js here
    // Access request data via request.query, request.body, etc.

    const corsHeaders = buildCorsHeaders(
      CORS_METHODS,
      request.headers.get("origin"),
    );

    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders,
      };
    }

    // Contact form endpoint
    try {
      // Parse the request body into a Javascript object
      const body = await request.json();

      const {
        fullName,
        businessName,
        email,
        phone,
        serviceType,
        hasDomain,
        message,
        recaptchaToken,
      } = body;

      // Validation rules
      if (!fullName || !businessName || !email || !phone || !serviceType)
        return {
          status: 400,
          body: "Missing required fields: fullName, businessName, email, phone, and serviceType are required",
        };
      // Note: In production, you should verify reCAPTCHA here as well

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return {
          status: 400,
          body: "Invalid email format",
        };

      // Check validation errors
      const errors = validationResult(request);
      if (!errors.isEmpty())
        return {
          status: 400,
          body: "Validation failed",
        };

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
      context.log("SMTP connection verified successfully");

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
      //   const [adminResult, customerResult] = await Promise.all([
      //     transporter.sendMail(adminMailOptions),
      //     transporter.sendMail(customerMailOptions),
      //   ]);

      const adminResult = await transporter.sendMail(adminMailOptions);
      const customerResult = await transporter.sendMail(customerMailOptions);

      context.log("Admin email sent:", adminResult.messageId);
      context.log("Customer email sent:", customerResult.messageId);

      //   // Log submission (you could also save to database here)
      //   context.log("Form submission:", {
      //     timestamp: new Date().toISOString(),
      //     fullName,
      //     email,
      //     businessName,
      //     serviceType,
      //   });

      return {
        status: 200,
        body: JSON.stringify({
          message:
            "Form submitted successfully! We will contact you within 24 hours.",
        }),
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      };
    } catch (error) {
      context.error("Error processing contact form:", error);
      return {
        status: 500,
        body: "Something went wrong. Please try again or contact us directly at service@hillviewgroupinc.com",
        headers: corsHeaders,
      };
    }
  },
});
