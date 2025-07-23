# 🎓 Tutor Finder — A Full-Stack Platform to Connect Students and Tutors

**Tutor Finder** is a feature-rich MERN stack web application that helps students find the best tutors based on location, subject, and availability. It supports everything from real-time chat and group creation to tutor reviews and media sharing.
<img src="/Tutor_Finder.png" alt="Tutor Finder Homepage" width="500" height="400"/>



## 🚀 Live Demo

> 🌐 **Live App**: https://major-project-frontend-iqr1.onrender.com/  
> 🧪 Sample Tutor Credentials  
> 📧 Email: `vimalnegi2003@gmail.com`  
> 🔐 Password: `Vimal@1234`
> > 🧪 Sample Learner Credentials  
> 📧 Email: `vicky2003@gmail.com`  
> 🔐 Password: `Vicky@1234`



## ✨ Core Features

### 👥 Authentication & Roles
- Secure JWT-based login/signup
- Role-specific dashboards (Tutor & Student)
- Password encryption with `bcrypt`

### 👨‍🏫 Tutor Functionality
- Create & manage detailed tutor profile
- Define subjects, location, experience
- **Create study groups** and manage student requests
- View and reply to messages
- **Receive student reviews and ratings**

### 👨‍🎓 Student Functionality
- Search tutors by subject or city
- Request to join 1:1 or group sessions
- **Review and rate tutors** after sessions
- Chat with tutors in real-time

### 💬 Real-Time Messaging
- Built using **Socket.IO**
- **1:1 Chat** and **Group Chat** support
- **Live typing indicators** and timestamps

### 📎 Multimedia Sharing
- Send **images,  videos, and files** in chat
- Media preview in chat
- File upload with **Multer** and**Cloudinary** support

### ⭐ Ratings & Reviews
- Students can leave **star-based ratings** with **comments**
- Optional text feedback for tutors
- Tutor dashboard shows average rating & reviews

### 🔔 Notifications
- Live alerts on message and request activity
- New group request notifications for tutors

---

## 🧰 Tech Stack

| Layer         | Technologies                          |
|---------------|----------------------------------------|
| Frontend      | React.js, Redux Toolkit, Tailwind CSS  |
| Backend       | Node.js, Express.js                    |
| Database      | MongoDB + Mongoose                     |
| Realtime Chat | Socket.IO                              |
| File Upload   | Multer + Cloudinary          |
| Authentication| JWT + bcrypt                           |
| State Mgmt    | Redux Toolkit                          |

---

## 📁 Project Structure
```
Tutor_Finder/
├── client/ # React app
│ ├── components/ # Shared UI components
│ ├── pages/ # Login, Dashboard, Profile, etc.
│ ├── redux/ # Redux slices & store
│ └── App.js
├── server/ # Express + MongoDB backend
│ ├── controllers/ # Logic for auth, users, chat
│ ├── middleware/ # JWT, error handling, file upload
│ ├── models/ # MongoDB schemas
│ ├── routes/ # API route handlers
│ ├── socket/ # Socket.IO configuration
│ └── server.js
```
## ⚙️ Local Setup

### 1. Clone the Project

```
git clone https://github.com/Vimalnegi03/Tutor_Finder.git
cd Tutor_Finder
```
**2. Backend Setup**
```
cd server
npm install
```
**Run the backend:**
```
npm run dev
```
**3. Frontend Setup**
```
cd ../client
npm install
npm start
```
**Frontend: http://localhost:3000**
**Backend: http://localhost:5000**

## 🚀 Schemas-:
![Homepage](/LMS_Schema.png)
## 🖼️ Screenshots-:
### HomePage -:
![Homepage](/HomePage.png)
### About -:
![About](/About.png)
### Library -:
![Library](/Library.png)
### Notes -:
![Notes](/Notes.png)
### Doubt Solver -:
![Doubt Solver](/Doubt_Solver.png)
### Contact -:
![Contact](/Contact.png)
### Learner Dashboard -:
![Learner Dashboard](/Learner_Dashboard.png)
### Tutor Dashboard -:
![Tutor Dashboard](/Tutor_Dashboard.png)
### Chat -:
![Chat](/Chat.png)
### Groups -:
![Tutor Dashboard](/Groups.png)
### Group_Members -:
![Chat](/Group_Members.png)
### Group Chat -:
![Tutor Dashboard](/Group_chat.png)
### Edit Group -:
![Chat](/Edit_Group.png)


👨‍💻 Author
Vimal Negi
📎 GitHub: @Vimalnegi03
🔗 LinkedIn: www.linkedin.com/in/vimal-negi
