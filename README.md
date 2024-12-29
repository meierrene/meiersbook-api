### **README for `meiersbook-api`**

# ⚙️ **MeiersBook API**

The **backend** of MeiersBook, offering secure and scalable RESTful APIs for managing user authentication, posts, and email notifications.

---

## 🛠️ **Features**

- 🔒 **JWT Authentication**: Secure user authentication.
- ✏️ **Post CRUD**: Full post management functionality.
- 📧 **Email Notifications**: Welcome and password recovery emails.
- 🚤️ **Database**: MongoDB for scalable data storage.
- ⚙️ **Error Handling**: Robust error responses for debugging.

---

## 🧪 **Tech Stack**

| **Technology** | **Description**   |
| -------------- | ----------------- |
| **Node.js**    | Backend Framework |
| **Express.js** | Web Framework     |
| **MongoDB**    | Database          |
| **Mongoose**   | ODM for MongoDB   |
| **Brevo**      | Email Service     |
| **JWT**        | Authentication    |

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
DATABASE_URL=mongodb+srv://<username>:<password>@cluster.meiersbook.mongodb.net
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USERNAME=<username>
EMAIL_PASSWORD=<password>
EMAIL_FROM=contact@renemeier.info
```

### **4️⃣ Run the Development Server**

```bash
npm start
```

---

## 📁 **API Endpoints**

| **Method** | **Endpoint**          | **Description**     |
| ---------- | --------------------- | ------------------- |
| `POST`     | `/api/v1/auth/signup` | Register a new user |
| `POST`     | `/api/v1/auth/login`  | Log in a user       |
| `GET`      | `/api/v1/posts`       | Get all posts       |
| `POST`     | `/api/v1/posts`       | Create a new post   |
| `PATCH`    | `/api/v1/posts/:id`   | Update a post by ID |
| `DELETE`   | `/api/v1/posts/:id`   | Delete a post by ID |

---

## 📁 **Project Structure**

```plaintext
src/
├── routes/         # API route definitions
├── controllers/    # Request handlers
├── models/         # Mongoose schemas
├── utils/          # Utility functions
└── server.js       # Application entry point
```

---

## 🧥 **Testing**

Test your API using **Postman** or other tools:

1. Import the API endpoints.
2. Use example payloads from the documentation.
3. Verify responses and debug as necessary.

---

## 🧥 **Contributing**

We welcome contributions!

- Fork the repository
- Create a feature branch: `git checkout -b feature/feature-name`
- Submit a pull request
