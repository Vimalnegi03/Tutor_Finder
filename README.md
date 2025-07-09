# Offline Learning System

An **Offline Learning System** that enables seamless interaction between learners and tutors, allowing both to upload profiles, match based on interests and skills, and initiate conversations if both parties show mutual interest. The system includes real-time chat functionality once learners and tutors connect.

## UI-:
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
### Chat
![Chat](/Chat.png)
## Features

- **User Roles**:
  - **Learner**: Can view tutor profiles and swipe right if interested.
  - **Tutor**: Can view learner profiles who have swiped right on them and connect with learners by swiping right in return.
  - **Admin**: Can view and manage all users.
  
- **User Matching**: Learners and tutors are matched based on skills and distance (within 10km).
  
- **Swipe & Connect**: Both learners and tutors can swipe right to express interest. If both swipe right, they can connect and chat.
  
- **Profile Management**: 
  - **Learner Profile**: Name, skills, location, photo, and other relevant details.
  - **Tutor Profile**: Profession, degrees, skills, and photo.
  
- **Location-based Search**: Tutors are filtered based on location proximity to the learner using OpenStreetMap (OSM) and Nominatim for geolocation services.
  
- **Real-time Chat**: Chat functionality between learners and tutors using **Socket.io**.
  
- **Offline Mode**: Both learners and tutors can manage their profiles and interactions offline. Chat history can be viewed offline.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Daisy UI
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Geolocation**: OpenStreetMap (OSM) and Nominatim
- **Real-time Communication**: Socket.io
- **Authentication**: JWT-based authentication

## Installation

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js](https://nodejs.org/).
- **MongoDB**: MongoDB should be installed or you can use a cloud instance like MongoDB Atlas.
  
### Clone the Repository

```bash
git clone https://github.com/your-username/offline-learning-system.git
cd offline-learning-system
```
Made with❤️ by Vimal Negi
