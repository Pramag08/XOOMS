# 🏠 XOOMS - Premium Property Rental Platform

Welcome to **XOOMS** – your gateway to verified, premium rental properties worldwide. We're bridging the gap between premium rental expectations and reality by offering verified living standards with seamless property management and booking experiences.

![XOOMS](https://img.shields.io/badge/XOOMS-Premium%20Rentals-brightgreen)
![Status](https://img.shields.io/badge/Status-Active-blue)

## 📸 Platform Overview

XOOMS is a comprehensive property rental platform designed for both property owners and renters. Whether you're looking to book your next premium stay or manage a global property portfolio, XOOMS makes it simple, secure, and enjoyable.

**Verified Living Standards** • **Global Properties** • **Secure Transactions** • **Easy Management**

---

## 🎯 What is XOOMS?

XOOMS is a modern web application that connects property owners with renters seeking verified, premium accommodations. The platform handles everything from property listing and verification to booking and payment – all in one place.

### For Property Owners
- **Showcase Your Properties**: Upload beautiful photos and detailed descriptions of your properties
- **Manage Listings**: Update availability, pricing, and property details from your dashboard
- **Verification Process**: Get your properties verified to build trust with renters
- **Booking Management**: Track bookings, manage inquiries, and communicate with renters
- **Global Reach**: List properties in multiple locations and attract international renters

### For Renters
- **Search with Ease**: Find properties by location, dates, and property type
- **Verified Quality**: All properties are verified to ensure premium standards
- **Secure Booking**: Book your stay with confidence through our secure platform
- **User Profile**: Create an account and manage your bookings and preferences
- **Payment Security**: Safe and encrypted payment processing

### For Admins
- **Platform Management**: Monitor all properties and user accounts
- **Verification Control**: Review and verify new property listings
- **User Management**: Manage user accounts and permissions
- **Quality Assurance**: Ensure all properties meet platform standards
- **Analytics & Reporting**: Track platform metrics and user activity

---

## 🏗 How the Platform Works

### For Property Owners

**1. Create an Account**
- Sign up with email or use Google/Apple authentication
- Complete your profile with contact information
- Verify your email address

**2. Add a Property**
- Click "Add Property" from your dashboard
- Fill in property details (location, amenities, description)
- Upload high-quality photos of your property
- Set pricing and availability calendar
- Submit for verification

**3. Property Verification**
- Admin team reviews your property details
- Property is checked for quality standards
- Photos are verified for authenticity
- Once approved, your property goes live on the platform

**4. Manage Bookings**
- View incoming booking requests
- Communicate with potential renters
- Accept or decline bookings
- Track confirmed reservations
- Manage cancellations if needed

### For Renters

**1. Create Your Account**
- Sign up with email or OAuth (Google/Apple)
- Complete your profile
- Save payment information for smooth checkout

**2. Search for Properties**
- Use the search bar to find properties by location
- Filter by dates you need to stay
- Browse verified properties with photos and reviews
- View property details, amenities, and host information

**3. Book Your Stay**
- Select your check-in and check-out dates
- Review the total price and terms
- Complete the booking with secure payment
- Receive confirmation email with property details
- Access property information and owner contact details

**4. Enjoy Your Stay**
- Check-in at the property
- Enjoy your verified, premium accommodation
- Leave a review and rating after your stay

### For Admins

**1. Dashboard Overview**
- Monitor total active properties and users
- View recent bookings and transactions
- Track platform activity

**2. Property Verification**
- Review new property submissions
- Check property photos and descriptions
- Verify location and amenities
- Approve or request changes for listings

**3. User Management**
- View all registered users
- Manage user permissions
- Handle user support requests
- Monitor suspicious activities

**4. Quality Control**
- Ensure properties meet platform standards
- Remove properties that violate guidelines
- Maintain platform reputation
- Review user feedback and ratings

---

## ✨ Key Features

✅ **Multi-Role System** - Admin, owner, and renter functionalities  
✅ **Property Verification** - Quality control and trust building  
✅ **Secure Authentication** - Email/password + OAuth support  
✅ **Property Management** - Easy listing, updating, and removal  
✅ **Advanced Search** - Filter by location, dates, and property type  
✅ **Responsive Design** - Works perfectly on desktop and mobile  
✅ **Booking System** - Seamless reservation management  
✅ **User Profiles** - Personalized dashboards for all users  
✅ **Payment Integration** - Secure transaction processing  
✅ **Review System** - Community feedback and ratings  

---

## 🚀 Getting Started

### What You Need

Before you start, make sure you have:
- **Node.js** (version 18 or newer)
- **Python** (version 3.9 or newer)
- **PostgreSQL** database
- A code editor (VS Code recommended)
- Git for version control

### Quick Setup

#### 1. Download the Project

```bash
git clone https://github.com/vaibhav-sahni/staymadesimple.git
cd staymadesimple
```

#### 2. Set Up the Backend

```bash
# Create a virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate    # On Mac/Linux
# or
venv\Scripts\activate       # On Windows

# Install dependencies
pip install -r requirements.txt
```

#### 3. Set Up the Frontend

```bash
cd app/frontend

# Install packages
npm install

# Copy environment file
cp .env.example .env
```

#### 4. Set Up Your Database

```bash
# Create a PostgreSQL database
createdb auth_db
```

---

## 🏃 Running the Application

### Start the Backend

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Set up your environment variables
export AUTH_DATABASE_URL="postgresql://postgres:password@localhost:5432/auth_db"
export SECRET_KEY="your-secret-key-here"

# Run the server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at: **http://localhost:8000**

Access the API documentation at: **http://localhost:8000/docs**

### Start the Frontend

Open a new terminal:

```bash
cd app/frontend

# Start the development server
npm start
```

The frontend will be available at: **http://localhost:3000**

---

## 🌐 Using the API

The backend provides a REST API for all operations. Here are some common endpoints:

### Authentication

**Login:**
```
POST /login
Body: { "email": "user@example.com", "password": "password" }
```

**Sign Up:**
```
POST /signup
Body: { "email": "user@example.com", "password": "password", "name": "John Doe" }
```

### Properties

**Search Properties:**
```
GET /api/properties?location=Bangalore&check_in=2026-07-01&check_out=2026-07-05
```

**Get Property Details:**
```
GET /api/properties/{property_id}
```

**Add New Property (Owner):**
```
POST /api/properties
Body: { "name": "...", "location": "...", "price": "...", ... }
```

### Bookings

**Create Booking:**
```
POST /api/bookings
Body: { "property_id": "...", "check_in": "...", "check_out": "..." }
```

**Get My Bookings:**
```
GET /api/bookings/my-bookings
```

> For complete API documentation, visit **http://localhost:8000/docs** when the backend is running.

---

## 📋 Environment Setup

### Backend Configuration (.env)

```env
# Database connection
AUTH_DATABASE_URL=postgresql://postgres:password@localhost:5432/auth_db

# Security key for sessions
SECRET_KEY=your-very-long-random-secret-key

# Optional API keys
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend Configuration (app/frontend/.env)

```env
# Gemini API for AI features
GEMINI_API_KEY=your-gemini-api-key

# Your app URL
APP_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
staymadesimple/
├── app/
│   └── frontend/              # React web interface
│       ├── src/
│       │   ├── components/    # UI components
│       │   ├── pages/         # Page screens
│       │   ├── App.tsx        # Main app
│       │   └── main.tsx       # Entry point
│       ├── package.json
│       └── .env.example
│
├── requirements.txt           # Python packages
├── app/main.py               # Backend server
├── .env.example              # Environment template
└── README.md                 # This file
```

---

## 💡 Common Tasks

### How to Add a New Property (As Owner)

1. Log in to your account
2. Go to "My Properties" or "Add Property"
3. Fill in property details:
   - Property name and description
   - Location/address
   - Number of bedrooms, bathrooms
   - Amenities (WiFi, AC, Kitchen, etc.)
   - Price per night
   - Upload clear photos
4. Click "Submit for Verification"
5. Wait for admin approval (usually within 24 hours)
6. Once verified, your property appears in search results

### How to Book a Property (As Renter)

1. Log in or create an account
2. Use the search bar to find properties
3. Filter by location and dates needed
4. Browse verified properties and read descriptions
5. Click a property to see full details and photos
6. Select your check-in and check-out dates
7. Click "Book Now"
8. Review booking details and confirm payment
9. Receive confirmation email immediately

### How to Verify Properties (As Admin)

1. Log in to admin dashboard
2. Go to "Pending Verification"
3. Review property details and photos
4. Check if property meets quality standards
5. Click "Approve" or "Request Changes"
6. Property goes live after approval
7. Rejected properties get feedback for improvement

---

## 🎨 Technology Stack (Brief Overview)

**Frontend:** React with TypeScript for the user interface  
**Backend:** FastAPI for reliable APIs  
**Database:** PostgreSQL for data storage  
**Authentication:** Secure JWT-based login system  
**Styling:** Tailwind CSS for responsive design  

---

## 🤝 Contributing

Found a bug or have an idea? We'd love your help!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-idea`
3. Make your changes
4. Commit: `git commit -m "Add your change"`
5. Push: `git push origin feature/your-idea`
6. Open a Pull Request

---

## 📞 Questions or Issues?

- Open an [Issue](https://github.com/vaibhav-sahni/staymadesimple/issues) on GitHub
- Check out existing [Discussions](https://github.com/vaibhav-sahni/staymadesimple/discussions)
- Review [API Documentation](http://localhost:8000/docs)

---

## 👤 About

Built by [Vaibhav Sahni](https://github.com/vaibhav-sahni)

**XOOMS** - Making premium rentals simple and accessible to everyone worldwide.

---

**Version:** 1.0.0  
**Last Updated:** April 2026
