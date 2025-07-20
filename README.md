# 💖 LeetLove

**LeetLove** is an open-source, full-stack, coding interview preparation platform inspired by LeetCode. It features a polished, modern UI; a growing library of curated challenges; real-time code execution; insightful stats; an activity streak calendar; profile management; and admin tools—designed to help you improve consistently and ace your interviews.

## 🚀 Features

- **Rich Problem Library:**  
  Easily filter, sort, and search hundreds of coding challenges by tags, company, and difficulty. New questions are added regularly.

- **Live Monaco Editor:**  
  Experience fast, customizable, in-browser code writing and execution with syntax highlighting, themes, and multi-language support—all powered by the Monaco Editor.

- **Submission & Solution History:**  
  Instantly view your submissions, verdicts (success/fail), timestamps, and detailed stats to track your improvement over time.

- **Streak Calendar:**  
  Visualize your coding habits and commitment with a LeetCode/GitHub-style heatmap, motivating you to solve problems every day.

- **User Playlists:**  
  Organize, favorite, and share public/private playlists for targeted practice and easier learning journeys.

- **Avatar/Profile Management:**  
  Personalize your profile with an avatar image, update your details, and view your coding progress—all in one place.

- **Admin Portal:**  
  For admins: instantly add, edit, or moderate problems directly from a secure dashboard (role-based access).

- **Authentication:**  
  Secure registration and login using JWT in HTTP-only cookies for safe session management and persistent login.

- **Community and Discussions:**  
  *(Coming soon!)* Collaborative discussion threads and Q&A under each problem to foster peer learning and mentorship.

- **Modern & Responsive UI/UX:**  
  Beautiful pastel gradients, glassmorphism, intuitive controls, and full responsiveness—looks stunning on mobile and desktop.

---

## 🌐 Live Demo

**Try it now:**  
[https://leetlove-1.onrender.com/](https://leetlove-1.onrender.com/)

---

## 🔐 Demo Credentials

**Admin:**
```
email: Vicky@gmail.com
password: Vicky@1234
```


**User:**
```
email: vimalnegi2003@gmail.com
password: 123456789
```
*(Or sign up for your own account!)*

---

## 🛠️ Tech Stack

| Layer         | Technologies                                   |
|---------------|------------------------------------------------|
| Frontend      | React, Tailwind CSS, DaisyUI, Monaco Editor    |
| Backend       | Node.js, Express.js                            |
| Database      | PostgreSQL + Prisma ORM                        |
| File Upload   | Multer + Cloudinary                            |
| Authentication| JWT + bcrypt                                   |
| State Mgmt    | Zustand                                        |
| Form Schema   | React Hook Form, Zod                           |
| Icons         | Lucide                                         |

---

## 📦 Getting Started

### 1. Clone the repository
```
git clone https://github.com/Vimalnegi03/LeetLove.git
cd LeetLove
```

### 2. Install dependencies
```
npm install
cd frontend && npm install
```

### 3. Setup Environment Variables
Create `.env` files as shown:
```
DATABASE_URL=your_postgres_url
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Apply Database Migrations
```
npx prisma migrate dev
npx prisma generate
```

### 5. Start the Servers
```
Backend
npm run dev
Frontend
cd frontend
npm start
```

---

## 📁 Project Structure

```
LeetLove/
├── backend/
│ ├── controllers/
│ ├── middlewares/
│ ├── routes/
│ ├── fileUpload/
│ └── ...
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── store/
│ │ ├── pages/
│ │ └── ...
├── prisma/
│ └── schema.prisma
├── README.md
└── .env
```

---

## 🌟 Screenshots

<em>Add GIFs or embedded images of the live UI, code editor, heatmap streak calendar, and playlist features here for maximum impact.</em>

---

## 🗺️ Roadmap

- [ ] Problem discussion & Q&A threads
- [ ] Leaderboard and contest mode
- [ ] Enhanced notifications and alerts
- [ ] Multi-language code runners and test cases
- [ ] Social login (OAuth) integration

---

## 🙌 Contributing

Contributions and feature requests are welcome! Please fork the repo, create a branch, and submit a pull request.
Bug reports and feedback are highly appreciated to keep improving LeetLove for the whole community.

---

## 👤 Author

Built with ❤️ by [Vimalnegi03](https://github.com/Vimalnegi03)

**If you found this project helpful, please star the repo and spread the word!**

