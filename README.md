# GlamMate

> An AI-powered fashion platform that combines style discovery, a digital wardrobe, intelligent fashion search, and personalized outfit recommendations.

## Overview

GlamMate is a full-stack fashion platform designed to help users discover fashion inspiration, organize their personal wardrobe, and receive intelligent outfit recommendations.

The platform combines a social fashion experience with AI-assisted image understanding. Users can explore and save fashion content, build a digital closet by uploading their clothing items, and generate outfit suggestions based on their wardrobe and natural-language preferences.

The application follows a hybrid architecture: the main web application is built with Node.js and Express, while a dedicated Python service handles AI-powered image and text processing using a pretrained CLIP model.

---

## Key Features

### Fashion Discovery

* Explore a feed of fashion and style inspiration
* Create and share fashion posts
* Upload multiple images with captions and tags
* Like and save posts
* Browse individual fashion posts
* Discover styles and outfit ideas

### User Profiles

* Create and manage user profiles
* Custom username and profile information
* Profile and banner image uploads
* View user posts and collections
* Search users by name or username

### Authentication

* Email and password registration
* OTP-based email verification
* Secure password hashing with bcrypt
* Password strength validation
* Session-based authentication
* Google OAuth login using Passport.js
* MongoDB-backed session storage

### Digital Wardrobe

Users can create a personal digital closet by uploading images of their clothing and accessories.

Each wardrobe item can store:

* Name
* Category
* Colors
* Occasion
* Season
* Style
* Brand
* Price
* Notes

Supported categories include:

* Tops
* Bottoms
* Dresses
* Outerwear
* Shoes
* Bags
* Accessories

Users can also filter and search their wardrobe based on category, color, occasion, season, style, brand, and other metadata.

### AI-Powered Closet Processing

When a clothing image is added to the closet, GlamMate can process it through the AI service to:

* Generate an image embedding
* Detect colors
* Identify suitable occasions
* Classify style and formality
* Generate AI tags
* Combine AI-detected metadata with user-provided information

The resulting information is stored alongside the wardrobe item and can be used for search and outfit generation.

### Intelligent Fashion Search

GlamMate supports semantic fashion search using text embeddings.

Instead of relying only on exact keywords, users can search using natural-language queries such as:

> "Casual summer outfit for brunch"

The text query is converted into an embedding and used to find visually and semantically relevant fashion items and outfits.

### Personalized Outfit Suggestions

Users can generate outfit recommendations based on:

* A natural-language prompt
* Occasion
* Formality
* Personal wardrobe items
* AI-generated fashion metadata

The platform evaluates available clothing items and generates combinations suited to the requested context.

Examples:

* "Casual brunch with friends"
* "Formal dinner outfit"
* "Summer vacation look"
* "Indian wedding guest outfit"

---

## AI Architecture

GlamMate separates the web application from the AI processing layer.

```text
                         ┌──────────────────┐
                         │      User        │
                         │  Browser / UI    │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    GlamMate      │
                         │  Node.js/Express │
                         └────────┬─────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   │              │              │
                   ▼              ▼              ▼
             ┌──────────┐   ┌──────────┐   ┌───────────┐
             │ MongoDB  │   │ Passport │   │   Multer  │
             │ Database │   │   Auth   │   │  Uploads  │
             └──────────┘   └──────────┘   └─────┬─────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │ Python AI API   │
                                         │     Flask       │
                                         └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │ Pretrained CLIP │
                                         │ Image + Text AI │
                                         └─────────────────┘
```

The Node.js application communicates with the Python AI service through REST APIs.

---

## AI Processing Flow

### Image Processing

When a user uploads a clothing item:

```text
Clothing Image
      │
      ▼
Node.js Application
      │
      ▼
Python AI Service
      │
      ├──► Generate CLIP Image Embedding
      │
      └──► Classify Fashion Attributes
               │
               ├── Colors
               ├── Occasion
               ├── Style
               └── Formality
                      │
                      ▼
              Merge with User Input
                      │
                      ▼
              Store in MongoDB
```

The stored embedding and metadata can then be used for intelligent search and personalized outfit recommendations.

---

## Tech Stack

### Web Application

* Node.js
* Express.js
* EJS
* JavaScript

### Database

* MongoDB
* Mongoose

### Authentication

* Express Session
* MongoDB Session Store
* Passport.js
* Google OAuth
* bcrypt
* OTP-based email verification
* Nodemailer

### AI Service

* Python
* Flask
* Pretrained CLIP model
* Hugging Face ecosystem
* REST APIs

### Image Processing

* Sharp
* Multer
* Pillow

### Other Integrations

* Axios
* Replicate
* CSV processing tools

---

## Project Structure

```text
GlamMate/
│
├── ai-system/
│   ├── config/
│   ├── data/
│   ├── pipelines/
│   ├── scripts/
│   ├── services/
│   ├── app.py
│   ├── process_production.py
│   └── requirements.txt
│
├── config/
│   └── passport/
│
├── controllers/
│   ├── authController.js
│   ├── closetController.js
│   └── outfit-related controllers
│
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Collection.js
│   ├── ClosetItem.js
│   ├── Outfit.js
│   └── LuxuryOutfit.js
│
├── routes/
│   ├── routes.js
│   └── authRoutes.js
│
├── services/
│   ├── aiService.js
│   └── recommendation-engine.js
│
├── utils/
│   └── Outfit generation utilities
│
├── views/
│   └── EJS templates
│
├── public/
│   ├── uploads/
│   ├── images/
│   ├── css/
│   └── javascript/
│
├── app.js
├── seed.js
└── package.json
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* Python 3
* MongoDB
* pip

### Clone the Repository

```bash
git clone https://github.com/Rhythm-gaur-28/GlamMate.git
cd GlamMate
```

### Install Node.js Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000

MONGO_URL=your_mongodb_connection_string

SESSION_SECRET=your_session_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

AI_SERVICE_URL=http://localhost:5000
```

Additional environment variables may be required depending on the authentication and AI integrations being used.

---

## Running the AI Service

Navigate to the AI system directory:

```bash
cd ai-system
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS/Linux

```bash
source venv/bin/activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Start the Flask AI service:

```bash
python app.py
```

The AI service runs on:

```text
http://localhost:5000
```

Available endpoints include:

```text
GET   /health
POST  /generate-embedding
POST  /classify-attributes
POST  /text-embedding
POST  /batch-classify
```

---

## Running the Web Application

Return to the project root:

```bash
cd ..
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Screenshots

Screenshots will be added here to demonstrate:

* Landing page
* Fashion explore feed
* Authentication flow
* User profile
* Digital closet
* AI-powered clothing analysis
* Outfit suggestions
* Style Me interface

---

## Future Development

GlamMate is designed as an evolving fashion technology platform. Future development includes:

* Expanded AI-powered style recommendations
* Improved semantic search
* Advanced outfit compatibility scoring
* More personalized recommendations
* Enhanced social interactions
* Expanded wardrobe analytics
* Improved production deployment for the AI service
* Additional authentication providers
* Mobile-responsive enhancements

---

## Author

**Rhythm Gaur**

* GitHub: https://github.com/Rhythm-gaur-28

---

## License

This project is intended for educational and portfolio purposes.
