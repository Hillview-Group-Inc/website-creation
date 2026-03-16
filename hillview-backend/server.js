const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const sql = require("mssql");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// SQL Server Configuration
const dbConfig = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "HillviewBlog",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
};

// Mock data storage (used when DB is not available)
const mockStorage = {
  users: [],
  articles: [
    {
      id: 1,
      title: "5 Essential Elements Every Small Business Website Needs in 2024",
      excerpt:
        "Discover the must-have features that turn visitors into customers. Learn how to optimize your site for mobile, speed, and conversions.",
      content: `In today's digital-first world, your website is often the first impression potential customers have of your business. For local trade businesses like cleaning services, landscaping, and handyman work, a professional website can be the difference between getting the job or losing it to a competitor.

Here are the 5 essential elements every small business website needs:

1. **Mobile-Responsive Design**
Over 70% of local service searches happen on mobile devices. If your website doesn't look great and function perfectly on smartphones, you're losing customers. Ensure your site uses responsive design that adapts to any screen size.

2. **Clear Call-to-Action (CTA)**
Every page should guide visitors toward taking action. Whether it's "Call Now," "Get a Free Quote," or "Book Online," make it impossible to miss. Use contrasting colors and place CTAs above the fold.

3. **Trust Signals**
Include customer reviews, testimonials, before/after photos, and trust badges. For service businesses, trust is everything. Show real photos of your work, display your licenses and insurance information, and prominently feature positive customer feedback.

4. **Fast Loading Speed**
A slow website kills conversions. Aim for load times under 3 seconds. Optimize images, use efficient hosting, and minimize unnecessary code. Remember, customers are impatient—especially on mobile.

5. **Local SEO Optimization**
Include your business name, address, and phone number (NAP) on every page. Create location-specific content, claim your Google Business Profile, and ensure your site is indexed properly by search engines.

Implementing these elements doesn't require a massive budget. With the right approach, you can have a professional, conversion-focused website that works as hard as you do. Ready to upgrade your online presence? Let's talk about how we can help.`,
      category: "tips",
      icon: "fa-lightbulb",
      author: "Hillview Team",
      status: "published",
      createdAt: new Date("2024-01-15"),
      view_count: 156,
    },
    {
      id: 2,
      title: "How to Rank Your Local Business on Google: A Step-by-Step Guide",
      excerpt:
        "Learn proven SEO strategies specifically designed for local trade businesses. From Google Business Profile optimization to local keywords that drive calls.",
      content: `Ranking on Google's first page can transform your local business. When customers search "cleaning service near me" or "best landscaper in [your city]," you want to be at the top. Here's your complete roadmap to local SEO success.

**Step 1: Claim and Optimize Your Google Business Profile**
This is non-negotiable. Your Google Business Profile is often the first thing customers see. Add high-quality photos of your work, write a compelling business description using local keywords, and ensure your hours and contact info are accurate. Post updates weekly to show Google you're active.

**Step 2: Build Local Citations**
Get listed on relevant directories: Yelp, HomeAdvisor, Thumbtack, Angi, and industry-specific sites. Ensure your NAP (Name, Address, Phone) is identical across every platform. Inconsistencies hurt your rankings.

**Step 3: Collect and Manage Reviews**
Reviews are ranking factors and conversion drivers. Ask every satisfied customer for a review. Respond to all reviews—positive and negative—professionally. Aim for at least 10 new reviews per month.

**Step 4: Create Location-Specific Content**
Write blog posts about the areas you serve. "Best Spring Cleanup Tips for [City Name]" or "Why [Neighborhood] Homes Need Professional Pressure Washing." This signals to Google that you're relevant to local searches.

**Step 5: Build Local Backlinks**
Partner with other local businesses, sponsor community events, or get featured in local news. Each quality backlink from a local source boosts your authority.

**Step 6: Ensure Your Website is Technically Sound**
Mobile-friendly design, fast loading speeds, SSL security, and proper schema markup for local businesses. These technical foundations support all your other SEO efforts.

Local SEO is a marathon, not a sprint. Start with these steps, be consistent, and watch your rankings—and your phone calls—increase month over month.`,
      category: "growth",
      icon: "fa-chart-line",
      author: "Sarah Mitchell",
      status: "published",
      createdAt: new Date("2024-01-20"),
      view_count: 243,
    },
    {
      id: 3,
      title:
        "Avoiding Burnout: Work-Life Balance Tips for Service Business Owners",
      excerpt:
        "Running a trade business is demanding. Learn strategies to maintain your mental health while growing your company and serving customers.",
      content: `As a service business owner, you're wearing multiple hats—technician, salesperson, bookkeeper, marketer. The pressure to be available 24/7 can lead to serious burnout. Here's how to build a sustainable business without sacrificing your wellbeing.

**Set Clear Boundaries**
Establish specific business hours and communicate them clearly on your website, voicemail, and Google Business Profile. Use an online booking system that shows only your available times. When you're off, be off. Emergency services should be the exception, not the rule.

**Automate and Delegate**
Invest in systems that reduce manual work: scheduling software, automated appointment reminders, invoice generation. As you grow, hire help for administrative tasks so you can focus on high-value work (or rest).

**Price for Sustainability**
Many service business owners undercharge because they're trying to compete on price. Calculate your true costs—including your desired salary and benefits—and price accordingly. You can't pour from an empty cup, and you can't sustain a business that doesn't pay you fairly.

**Schedule Downtime Like You Schedule Jobs**
Block time for family, hobbies, and rest in your calendar. Treat these appointments with the same respect as customer bookings. Your creativity and energy for problem-solving depend on adequate recovery time.

**Build a Support Network**
Connect with other business owners who understand your challenges. Join local business associations, online forums, or mastermind groups. Sharing experiences and solutions prevents isolation and provides valuable perspective.

**Know the Warning Signs**
Irritability with customers, physical exhaustion, loss of passion for your work—these are red flags. If you notice these symptoms, it's time to take immediate action: delegate more, take a vacation, or speak with a professional.

Remember: Your business exists to support your life, not consume it. Building sustainable practices from the start creates a company that thrives for years without burning you out.`,
      category: "wellness",
      icon: "fa-heart",
      author: "Michael Torres",
      status: "published",
      createdAt: new Date("2024-01-25"),
      view_count: 189,
    },
    {
      id: 4,
      title:
        "Spring Marketing Checklist: Prepare Your Service Business for Peak Season",
      excerpt: `Spring is the busy season for most trades. Here's how to optimize your marketing, website, and operations to capture the seasonal rush.`,
      content: `Spring brings blooming flowers and booming business for landscapers, pressure washers, HVAC technicians, and cleaning services. Is your business ready to capture the surge in demand? Use this checklist to maximize your spring season.

**Pre-Season Website Updates (March)**
- Refresh your homepage with spring-themed imagery
- Update service descriptions to highlight spring-specific offerings
- Add seasonal promotions or spring cleaning packages
- Ensure your booking system can handle increased volume
- Test contact forms and phone numbers

**Digital Marketing Push (Late March - Early April)**
- Launch targeted Google Ads campaigns for spring keywords
- Post before/after spring cleanup photos on social media
- Send email campaigns to past customers offering spring services
- Update your Google Business Profile with spring photos and posts
- Create "Spring Home Maintenance" blog content

**Operational Preparation**
- Stock up on supplies before peak demand hits
- Hire and train seasonal staff early
- Implement online booking to handle increased inquiries efficiently
- Set up automated responses for common spring service questions

**Pricing Strategy**
Spring demand often allows for premium pricing. Don't leave money on the table:
- Analyze competitors' spring pricing
- Offer tiered packages (Basic, Standard, Premium spring services)
- Create urgency with limited-time spring promotions

**Customer Experience Focus**
With higher volume, service quality can slip. Counter this by:
- Setting realistic expectations on timing
- Communicating proactively about delays
- Following up after service to ensure satisfaction
- Asking for reviews while the experience is fresh

**Summer Preparation**
While spring is busy, start planning summer marketing in May. Transition content to summer services, adjust messaging for heat-related needs (AC services, drought-tolerant landscaping), and capture customer data for fall/winter marketing.

Spring success sets the tone for your entire year. Invest time in preparation, and you'll turn seasonal demand into long-term customer relationships.`,
      category: "seasonal",
      icon: "fa-calendar-alt",
      author: "Jessica Chen",
      status: "published",
      createdAt: new Date("2024-02-01"),
      view_count: 312,
    },
  ],
};

// Database connection pool
let dbPool = null;
let useMockMode = false;

async function connectDB() {
  try {
    dbPool = await sql.connect(dbConfig);
    console.log("✅ Connected to SQL Server");

    // Initialize admin user if not exists
    await initializeAdminUser();

    return dbPool;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    console.log("⚠️  Running in MOCK MODE - data will not persist");
    useMockMode = true;

    // Initialize mock admin user
    await initializeMockAdmin();

    return null;
  }
}

// Initialize mock admin for testing without database
async function initializeMockAdmin() {
  if (mockStorage.users.length === 0) {
    const hashedPassword = await bcrypt.hash("HillviewAdmin2024!", 10);
    mockStorage.users.push({
      id: 1,
      username: "admin",
      password_hash: hashedPassword,
      email: "admin@hillviewgroup.com",
      role: "admin",
      is_active: true,
      created_at: new Date(),
    });
    console.log(
      "✅ Mock admin created: username=admin, password=HillviewAdmin2024!",
    );
  }
}

// Initialize real admin user in database
async function initializeAdminUser() {
  try {
    const result = await dbPool
      .request()
      .query("SELECT COUNT(*) as count FROM Users WHERE username = 'admin'");

    if (result.recordset[0].count === 0) {
      const hashedPassword = await bcrypt.hash("HillviewAdmin2024!", 10);

      await dbPool
        .request()
        .input("username", sql.NVarChar, "admin")
        .input("password_hash", sql.NVarChar, hashedPassword)
        .input("email", sql.NVarChar, "admin@hillviewgroup.com")
        .input("role", sql.NVarChar, "admin")
        .query(`INSERT INTO Users (username, password_hash, email, role, is_active) 
                        VALUES (@username, @password_hash, @email, @role, 1)`);

      console.log(
        "✅ Admin user created: username=admin, password=HillviewAdmin2024!",
      );
    }
  } catch (err) {
    console.error("Error initializing admin:", err.message);
  }
}

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "hillview-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

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

// Authentication Middleware
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  if (useMockMode) {
    const user = mockStorage.users.find((u) => u.id === req.session.userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    req.user = user;
    return next();
  }

  try {
    const result = await dbPool
      .request()
      .input("id", sql.Int, req.session.userId)
      .query(
        "SELECT id, username, email, role FROM Users WHERE id = @id AND is_active = 1",
      );

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    req.user = result.recordset[0];
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= AUTH ROUTES =================

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username and password required" });
    }

    let user;

    if (useMockMode) {
      user = mockStorage.users.find((u) => u.username === username);
    } else {
      const result = await dbPool
        .request()
        .input("username", sql.NVarChar, username)
        .query(
          "SELECT * FROM Users WHERE username = @username AND is_active = 1",
        );
      user = result.recordset[0];
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Update last login
    if (!useMockMode) {
      await dbPool
        .request()
        .input("id", sql.Int, user.id)
        .query("UPDATE Users SET last_login = GETDATE() WHERE id = @id");
    }

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
});

// Check Session
app.get("/api/auth/check", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (useMockMode) {
    const user = mockStorage.users.find((u) => u.id === req.session.userId);
    if (user) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }
  } else {
    const result = await dbPool
      .request()
      .input("id", sql.Int, req.session.userId)
      .query(
        "SELECT id, username, email, role FROM Users WHERE id = @id AND is_active = 1",
      );

    if (result.recordset.length > 0) {
      return res.json({
        success: true,
        user: result.recordset[0],
      });
    }
  }

  res.status(401).json({ success: false, message: "Session invalid" });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: "Logged out successfully" });
});

// ================= BLOG ROUTES =================

// Get all published articles (Public - No auth required)
app.get("/api/blog", async (req, res) => {
  try {
    let articles;

    if (useMockMode) {
      articles = mockStorage.articles
        .filter((a) => a.status === "published")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const result = await dbPool.request()
        .query(`SELECT id, title, excerpt, category, icon, author, 
                        created_at as createdAt, view_count as viewCount
                        FROM Articles 
                        WHERE status = 'published' 
                        ORDER BY created_at DESC`);
      articles = result.recordset;
    }

    res.json({ success: true, articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch articles" });
  }
});

// Get single article by ID (Public - No auth required)
app.get("/api/blog/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let article;

    if (useMockMode) {
      article = mockStorage.articles.find(
        (a) => a.id === id && a.status === "published",
      );
      if (article) {
        article.view_count++;
      }
    } else {
      // Get article
      const result = await dbPool.request().input("id", sql.Int, id)
        .query(`SELECT id, title, excerpt, content, category, icon, author, 
                        created_at as createdAt, view_count as viewCount
                        FROM Articles 
                        WHERE id = @id AND status = 'published'`);

      article = result.recordset[0];

      if (article) {
        // Increment view count
        await dbPool
          .request()
          .input("id", sql.Int, id)
          .query(
            "UPDATE Articles SET view_count = view_count + 1 WHERE id = @id",
          );
      }
    }

    if (!article) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }

    res.json({ success: true, article });
  } catch (error) {
    console.error("Error fetching article:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch article" });
  }
});

// Create new article (Protected)
app.post("/api/blog", requireAuth, async (req, res) => {
  try {
    const { title, excerpt, content, category, icon, author } = req.body;

    // Validation
    if (!title || !excerpt || !content || !category || !author) {
      return res.status(400).json({
        success: false,
        message: "Title, excerpt, content, category, and author are required",
      });
    }

    const validCategories = ["tips", "growth", "wellness", "seasonal"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid category. Must be one of: tips, growth, wellness, seasonal",
      });
    }

    let newArticle;

    if (useMockMode) {
      newArticle = {
        id: mockStorage.articles.length + 1,
        title,
        excerpt,
        content,
        category,
        icon: icon || "fa-lightbulb",
        author,
        status: "published",
        createdAt: new Date(),
        view_count: 0,
      };
      mockStorage.articles.push(newArticle);
    } else {
      const result = await dbPool
        .request()
        .input("title", sql.NVarChar, title)
        .input("excerpt", sql.NVarChar, excerpt)
        .input("content", sql.NVarChar(sql.MAX), content)
        .input("category", sql.NVarChar, category)
        .input("icon", sql.NVarChar, icon || "fa-lightbulb")
        .input("author", sql.NVarChar, author)
        .input("status", sql.NVarChar, "published")
        .input("created_by", sql.Int, req.session.userId)
        .query(`INSERT INTO Articles (title, excerpt, content, category, icon, author, status, created_by, published_at)
                        OUTPUT INSERTED.*
                        VALUES (@title, @excerpt, @content, @category, @icon, @author, @status, @created_by, GETDATE())`);

      newArticle = result.recordset[0];
    }

    res.status(201).json({
      success: true,
      message: "Article created successfully",
      article: newArticle,
    });
  } catch (error) {
    console.error("Error creating article:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create article" });
  }
});

// Update article (Protected)
app.put("/api/blog/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, excerpt, content, category, icon, author, status } =
      req.body;

    // Check if article exists
    let existingArticle;
    if (useMockMode) {
      existingArticle = mockStorage.articles.find((a) => a.id === id);
    } else {
      const checkResult = await dbPool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT id FROM Articles WHERE id = @id");
      existingArticle = checkResult.recordset[0];
    }

    if (!existingArticle) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }

    if (useMockMode) {
      const article = mockStorage.articles.find((a) => a.id === id);
      article.title = title || article.title;
      article.excerpt = excerpt || article.excerpt;
      article.content = content || article.content;
      article.category = category || article.category;
      article.icon = icon || article.icon;
      article.author = author || article.author;
      article.status = status || article.status;
      article.updatedAt = new Date();

      res.json({
        success: true,
        message: "Article updated successfully",
        article,
      });
    } else {
      const result = await dbPool
        .request()
        .input("id", sql.Int, id)
        .input("title", sql.NVarChar, title)
        .input("excerpt", sql.NVarChar, excerpt)
        .input("content", sql.NVarChar(sql.MAX), content)
        .input("category", sql.NVarChar, category)
        .input("icon", sql.NVarChar, icon)
        .input("author", sql.NVarChar, author)
        .input("status", sql.NVarChar, status).query(`UPDATE Articles 
                        SET title = @title, excerpt = @excerpt, content = @content, 
                            category = @category, icon = @icon, author = @author, 
                            status = @status, updated_at = GETDATE()
                        WHERE id = @id`);

      res.json({
        success: true,
        message: "Article updated successfully",
      });
    }
  } catch (error) {
    console.error("Error updating article:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update article" });
  }
});

// Delete article (Protected)
app.delete("/api/blog/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if article exists
    let existingArticle;
    if (useMockMode) {
      existingArticle = mockStorage.articles.find((a) => a.id === id);
      if (existingArticle) {
        mockStorage.articles = mockStorage.articles.filter((a) => a.id !== id);
      }
    } else {
      const checkResult = await dbPool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT id FROM Articles WHERE id = @id");
      existingArticle = checkResult.recordset[0];

      if (existingArticle) {
        await dbPool
          .request()
          .input("id", sql.Int, id)
          .query("DELETE FROM Articles WHERE id = @id");
      }
    }

    if (!existingArticle) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }

    res.json({ success: true, message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete article" });
  }
});

// Get all articles for admin (including drafts - Protected)
app.get("/api/admin/blog", requireAuth, async (req, res) => {
  try {
    let articles;

    if (useMockMode) {
      articles = mockStorage.articles.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    } else {
      const result = await dbPool.request()
        .query(`SELECT id, title, excerpt, category, icon, author, status,
                        created_at as createdAt, view_count as viewCount
                        FROM Articles 
                        ORDER BY created_at DESC`);
      articles = result.recordset;
    }

    res.json({ success: true, articles });
  } catch (error) {
    console.error("Error fetching admin articles:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch articles" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mode: useMockMode ? "MOCK" : "DATABASE",
  });
});

// Initialize and start server
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(
      `📧 Email service configured for: ${process.env.SMTP_USER || "Not configured"}`,
    );
    console.log(`🔗 API endpoints:`);
    console.log(`   - Contact Form: http://localhost:${PORT}/api/contact`);
    console.log(`   - Blog (Public): http://localhost:${PORT}/api/blog`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Admin: http://localhost:${PORT}/admin-blog.html`);
    console.log(`⚙️  Mode: ${useMockMode ? "MOCK (In-Memory)" : "SQL Server"}`);
  });
}

startServer();

module.exports = app;
