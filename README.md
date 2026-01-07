---
title: SkyFlix API
emoji: 🎬
colorFrom: red
colorTo: gray
sdk: docker
pinned: false
---
# 🎬 SkyFlix

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![MERN Stack](https://img.shields.io/badge/MERN-Stack-green.svg)
![Vite](https://img.shields.io/badge/Vite-Rapid-purple.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue.svg)

**SkyFlix** is a modern, high-performance movie and series streaming application built with the **MERN stack** (MongoDB, Express, React, Node.js). It features a sleek user interface powered by **Tailwind CSS** and **Vite**, offering a seamless viewing experience with unique integration for **RPMShare** video streams.

## 🚀 Features

* **⚡ High-Performance Frontend:** Built with React and Vite for blazing fast load times.
* **🎨 Modern UI/UX:** Fully responsive design using Tailwind CSS, ensuring a great experience on mobile and desktop.
* **🎥 RPMShare Integration:** Specialized support for streaming content hosted on RPMShare using file codes.
* **🔍 Advanced Search:** Easily find movies and TV shows with instant search functionality.
* **📂 Content Categorization:** Organized libraries for Movies and Series.
* **🔒 Secure Backend:** Robust Node.js and Express API for handling requests.
* **💾 MongoDB Database:** Efficient data storage for movie metadata and file links.

## 🛠️ Tech Stack

### Frontend
* **React.js** (v18+)
* **Vite** (Build Tool)
* **Tailwind CSS** (Styling)
* **Lucide React** (Icons)

### Backend
* **Node.js** (Runtime)
* **Express.js** (Framework)
* **MongoDB & Mongoose** (Database)

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` files.

### Backend (`server/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
RPMSHARE_API_KEY=your_rpmshare_api_key
TMDB_API_KEY=your_tmdb_api_key
Frontend (client/.env)
Code snippet

VITE_API_URL=http://localhost:5000
📦 Installation & Getting Started
Follow these steps to set up the project locally.

1. Clone the Repository
Bash

git clone [https://github.com/Jay-Naik2526/skyflix.git](https://github.com/Jay-Naik2526/skyflix.git)
cd skyflix
2. Backend Setup
Navigate to the server directory and install dependencies:

Bash

cd server
npm install
Start the backend server:

Bash

npm run dev
# Server should run on http://localhost:5000
3. Frontend Setup
Open a new terminal, navigate to the client directory, and install dependencies:

Bash

cd client
npm install
Start the frontend application:

Bash

npm run dev
# Client should run on http://localhost:5173
🤝 Contributing
Contributions are always welcome!

Fork the repository.

Create a new branch (git checkout -b feature/amazing-feature).

Commit your changes (git commit -m 'Add some amazing feature').

Push to the branch (git push origin feature/amazing-feature).

Open a Pull Request.

📄 License
This project is licensed under the MIT License.

👤 Author
Jay Naik

GitHub: @Jay-Naik2526