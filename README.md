# AI Content Management System

An AI-powered Content Management System that uses Google Gemini AI to
generate high-quality content from a topic, tone, and content type.

## Live Demo

**Live Application:** https://kiran-ai-content.duckdns.org

**GitHub Repository:**
https://github.com/Kumbharkiran2004/ai-content-management

## Features

-   AI content generation using Google Gemini
-   Generate content from a custom topic
-   Select content tone
-   Select content type
-   Automatically save generated content to MongoDB
-   View saved content
-   Update existing content
-   Delete content
-   REST API backend
-   Web-based user interface
-   HTTPS with Let's Encrypt
-   AWS EC2 deployment
-   Jenkins and GitHub CI/CD

## Architecture

``` text
User
  |
  v
React + Vite Frontend
  |
  v
Nginx
  |
  v
Node.js + Express Backend
  |
  +----> Google Gemini AI
  |
  +----> MongoDB Atlas
```

## Technologies Used

### Frontend

-   React
-   Vite
-   JavaScript
-   CSS

### Backend

-   Node.js
-   Express.js
-   CORS
-   dotenv
-   MongoDB Driver
-   Google Gemini SDK (`@google/genai`)

### Database

-   MongoDB Atlas

### AI

-   Google Gemini
-   Model: `gemini-3.1-flash-lite`

### DevOps and Deployment

-   AWS EC2
-   Nginx
-   Jenkins
-   GitHub
-   Let's Encrypt
-   Certbot
-   DuckDNS

## Project Structure

``` text
ai-content-management/
|
+-- client/
|   +-- src/
|   |   +-- App.jsx
|   |   +-- App.css
|   +-- package.json
|
+-- server/
|   +-- server.js
|   +-- package.json
|   +-- package-lock.json
|   +-- .env
|
+-- .gitignore
+-- README.md
```

## API Endpoints

### Health Check

``` http
GET /
```

### Get All Content

``` http
GET /api/content
```

### Get Single Content

``` http
GET /api/content/:id
```

### Generate AI Content

``` http
POST /api/generate
```

Example request:

``` json
{
  "topic": "Artificial Intelligence in Education",
  "tone": "Professional",
  "contentType": "Article"
}
```

The generated content is automatically saved in MongoDB.

### Create Content

``` http
POST /api/content
```

### Update Content

``` http
PUT /api/content/:id
```

### Delete Content

``` http
DELETE /api/content/:id
```

## Local Setup

### 1. Clone Repository

``` bash
git clone https://github.com/Kumbharkiran2004/ai-content-management.git
cd ai-content-management
```

### 2. Backend Setup

``` bash
cd server
npm install
```

Create a `.env` file:

``` env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

``` bash
node server.js
```

Backend runs on:

``` text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

``` bash
cd client
npm install
npm run dev
```

The frontend will be available at the Vite development URL shown in the
terminal.

## Environment Variables

Never commit API keys or database passwords to GitHub.

Required variables:

``` env
MONGODB_URI=
GEMINI_API_KEY=
```

The `.env` file is excluded using `.gitignore`.

## Deployment

The application is deployed on AWS EC2.

``` text
GitHub
   |
   v
Jenkins CI/CD
   |
   v
AWS EC2
   |
   +-- Nginx
   |     |
   |     +-- React Production Build
   |
   +-- Node.js + Express
          |
          +-- Google Gemini
          |
          +-- MongoDB Atlas
```

GitHub pushes trigger Jenkins through a webhook. Jenkins clones the
project, installs dependencies, runs tests, and deploys the application.

## HTTPS

HTTPS is enabled using Let's Encrypt, Certbot, and Nginx.

Live secure URL:

https://kiran-ai-content.duckdns.org

## Database

MongoDB Atlas database:

``` text
ai_content_management
```

Collection:

``` text
contents
```

Content records include fields such as:

``` text
topic
tone
contentType
content
generatedBy
model
createdAt
updatedAt
```

## CI/CD Pipeline

``` text
Developer
   |
   v
Git Commit
   |
   v
GitHub (main)
   |
   v
Jenkins Webhook
   |
   +-- Clone
   +-- Install Dependencies
   +-- Test
   +-- Deploy
          |
          v
       AWS EC2
```

## Project Objective

This project demonstrates the integration of:

-   Artificial Intelligence
-   React Web Development
-   Node.js Backend Development
-   REST APIs
-   MongoDB Database
-   AWS Cloud Deployment
-   Jenkins CI/CD
-   Nginx
-   HTTPS Security

## Author

**Kiran Kumbhar**

GitHub Repository:

https://github.com/Kumbharkiran2004/ai-content-management

------------------------------------------------------------------------

If you find this project useful, please give the repository a star.
