# Smart Vision 🎯

An intelligent AI-powered face detection web application that allows users to upload images and detect faces in real-time with visual bounding boxes.

## ✨ Features

- 🔐 **Secure Authentication** - Google OAuth and email/password login
- 🤖 **AI Face Detection** - Real-time face recognition using Clarifai API
- 👤 **User Profiles** - Personalized dashboard with detection history
- 📊 **Entry Tracking** - Monitor your face detection count
- 📱 **Fully Responsive** - Seamless experience on mobile and desktop
- 🔒 **Security Features** - Password reset, email verification, and account management

## 🛠️ Tech Stack

**Frontend**
- React 18 with Vite
- Modern CSS3 with animations
- Firebase Authentication
- Responsive design

**Backend**
- Node.js & Express
- PostgreSQL database
- Bcrypt password hashing
- RESTful API architecture

**AI & Services**
- Clarifai Face Detection API
- Google OAuth 2.0
- Firebase Auth

## 🚀 Live Demo

[Coming Soon - Deployed on Render]

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- Firebase account
- Clarifai API key

### Setup

1. **Clone the repository**
git clone https://github.com/exe901/smart-vision.git
cd smart-vision

text

2. **Install dependencies**
npm install

text

3. **Configure environment variables**

Create a `.env` file in the root directory:

Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

Clarifai
CLARIFAI_PAT=your_clarifai_api_key
CLARIFAI_USER_ID=clarifai
CLARIFAI_APP_ID=main

Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

text

4. **Set up PostgreSQL database**
CREATE DATABASE smart;

CREATE TABLE users (
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
name VARCHAR(255),
entries INTEGER DEFAULT 0,
joined TIMESTAMP DEFAULT NOW(),
provider VARCHAR(50)
);

CREATE TABLE login (
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
hash VARCHAR(255) NOT NULL
);

text

5. **Run the application**

Start backend:
node server.js

text

Start frontend (new terminal):
npm run dev

text

Visit `http://localhost:5173`

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📄 License

MIT License - feel free to use this project for learning or your portfolio!

## 👨‍💻 Author

**Nour Alaa**
  - GitHub: [EXE901](https://github.com/EXE901)
- LinkedIn: [Nour Alaa](https://www.linkedin.com/in/nour-alaa-428466371/)

---

⭐ Star this repo if you found it helpful!
