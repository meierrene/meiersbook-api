# ⚙️ **MeiersBook API**

Welcome to the **backend** of MeiersBook! A robust and scalable RESTful API designed to power the MeiersBook application. This API supports user authentication, post management, email notifications, and much more!

---

## 🛠️ **Features**

- 🔒 **JWT Authentication**: Secure and scalable user authentication.
- ✍️ **Post Management**: Comprehensive CRUD functionality for posts.
- 📬 **Email Notifications**: Automated welcome and password recovery emails.
- 📂 **Database**: MongoDB ensures reliable and scalable data storage.
- 🛡️ **Error Handling**: Centralized error handling for seamless debugging.
- 🌍 **OAuth Integration**: Google OAuth for streamlined user onboarding.

---

## 🧪 **Tech Stack**

| **Technology**        | **Description**                   |
| --------------------- | --------------------------------- |
| **Node.js**           | Backend JavaScript runtime        |
| **Express.js**        | Web application framework         |
| **MongoDB**           | NoSQL database                    |
| **Mongoose**          | MongoDB object modeling tool      |
| **Brevo (Email API)** | Email delivery and notifications  |
| **Supabase**          | File storage solution             |
| **JWT**               | Secure token-based authentication |
| **Google OAuth**      | Social login for user onboarding  |

---

## 🚀 **Getting Started**

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/meierrene/meiersbook-api.git
cd meiersbook-api
```

### **2️⃣ Install Dependencies**

```bash
npm install
```

### **3️⃣ Set Environment Variables**

Create a `.env` file and add:

```env
NODE_ENV=development
PORT=5000
DATABASE=mongodb+srv://<username>:<password>@cluster.meiersbook.mongodb.net/devData?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USERNAME=<username>
EMAIL_PASSWORD=<password>
EMAIL_FROM=contact@anyemail.info
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

```

### **4️⃣ Run the Development Server**

```bash
npm start
```

---

## 📁 **API Endpoints**

### Authentication

| **Method** | **Endpoint**                        | **Description**                             |
| ---------- | ----------------------------------- | ------------------------------------------- |
| `POST`     | `/api/v1/auth/signup`               | Register a new user.                        |
| `POST`     | `/api/v1/auth/login`                | Log in an existing user.                    |
| `GET`      | `/api/v1/auth/logout`               | Log out the current user.                   |
| `POST`     | `/api/v1/auth/forgotPassword`       | Request a password reset email.             |
| `PATCH`    | `/api/v1/auth/resetPassword/:token` | Reset a password using a valid reset token. |
| `PATCH`    | `/api/v1/auth/updateMyPassword`     | Update the current user's password.         |

---

### Users

| **Method** | **Endpoint**             | **Description**                                        |
| ---------- | ------------------------ | ------------------------------------------------------ |
| `POST`     | `/api/v1/users/signup`   | Register a new user with an optional profile picture.  |
| `POST`     | `/api/v1/users/login`    | Authenticate a user and generate a JWT.                |
| `GET`      | `/api/v1/users/logout`   | Log out the currently logged-in user.                  |
| `GET`      | `/api/v1/users/me`       | Retrieve the current logged-in user's details.         |
| `PATCH`    | `/api/v1/users/updateMe` | Update the current logged-in user's profile and image. |
| `DELETE`   | `/api/v1/users/deleteMe` | Delete the current logged-in user's account            |
| `GET`      | `/api/v1/users/find/:id` | Delete the current logged-in user's account            |

### Administrator's privilege

| **Method** | **Endpoint**                      | **Description**                                                 |
| ---------- | --------------------------------- | --------------------------------------------------------------- |
| `GET`      | `/api/v1/users/`                  | Get all users.                                                  |
| `PATCH`    | `/api/v1/users/:id`               | Update any user's details.                                      |
| `DELETE`   | `/api/v1/users/:id`               | Delete any user.                                                |
| `DELETE`   | `/api/v1/posts/delete-everything` | Delete all posts from every users. [!CAUTION] Use with coution! |

---

## 📁 **Project Structure**

```plaintext
src/
├── controllers/      # API request handlers
├── middlewares/      # Reusable middleware
├── models/           # MongoDB schemas
├── routes/           # Route definitions
├── utils/            # Utility functions
├── services/         # External service integrations
└── server.js         # Application entry point
```

---

## 🧪 **Testing the API**

Test your API using **Postman** or other tools:

1. Using Postman:

   - Import the API collection in Postman.
   - Add example payloads for testing each endpoint.

2. API Response Example:

   - A successful post creation:

```bash
{
  "status": "success",
  "data": {
    "id": "12345",
    "title": "My First Post",
    "content": "This is a test post.",
    "author": "My Name",
    "createdAt": "2025-01-01T12:00:00Z"}
}
```

---

## 🤝 **Contributing**

We welcome contributions! Follow these steps:

1. Fork the repository:

```bash
git fork https://github.com/meierrene/meiersbook-api.git
```

2. Create a feature branch:

```bash
git checkout -b feature/new-feature
```

3. Submit a pull request:

   - Provide a detailed description of the changes.

---

## 🔗 **Related Repositories**

### **README for `meiersbook-client`**

Frontend: [MeiersBook Client](https://github.com/meierrene/meiersbook-client).
