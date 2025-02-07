// 1️ **Import Dependencies**
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// 2️ **Initialize App & Variables**
const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = "supersecretkey"; // Use environment variables for production
let users = {}; // Store users in-memory (replace with a database in real-world usage)
let highScores = []; // Array to store high scores

// 3️ **Middleware Setup**
app.use(bodyParser.json());

// 4️ **Middleware for JWT Authentication**
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
}

// 5️ **User Signup Endpoint**
app.post("/signup", (req, res) => {
    const { userHandle, password } = req.body;

    console.log("Signup Request Body:", req.body);

    if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
        console.log("Signup failed: Invalid request body");
        return res.status(400).json({ error: "Invalid request body" });
    }
    if (users[userHandle]) {
        console.log("Signup failed: User already exists");
        return res.status(400).json({ error: "User already exists" });
    }

    users[userHandle] = password;
    console.log("User signed up successfully:", userHandle);
    res.status(201).send();
});

// 6️ **User Login Endpoint**
app.post("/login", (req, res) => {
    const { userHandle, password, ...extraFields } = req.body;

    console.log("Login Request Body:", req.body);
    console.log("Current users:", users);

    //  Ensure userHandle and password are both strings
    if (typeof userHandle !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Invalid input: userHandle and password must be strings" });
    }

    //  Check for missing credentials
    if (!userHandle || !password) {
        return res.status(400).json({ error: "Missing credentials" });
    }

    //  Reject additional unexpected fields
    if (Object.keys(extraFields).length > 0) {
        return res.status(400).json({ error: "Invalid request body" });
    }

    //  Check if user exists
    if (!users[userHandle]) {
        return res.status(401).json({ error: "User does not exist" });
    }

    //  Check if password is correct
    if (users[userHandle] !== password) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    //  Generate JWT token
    const token = jwt.sign({ userHandle }, SECRET_KEY, { expiresIn: "1h" });
    res.status(200).json({ jsonWebToken: token });
});

// 7️ **Ensure GET /login Returns 404**
app.get("/login", (req, res) => {
    return res.status(404).json({ error: "Not Found" });
});

// 8️ **Post High Score Endpoint (Requires JWT)**
app.post("/high-scores", authenticateToken, (req, res) => {
    const { level, userHandle, score, timestamp } = req.body;
    if (!level || !userHandle || !score || !timestamp) {
        return res.status(400).json({ error: "Invalid request body" });
    }
    highScores.push({ level, userHandle, score, timestamp });
    res.status(201).send();
});

// 9️ **Get High Scores Endpoint**
app.get("/high-scores", (req, res) => {
    const { level, page = 1 } = req.query;
    if (!level) return res.status(400).json({ error: "Level parameter required" });

    const scores = highScores
        .filter(score => score.level === level)
        .sort((a, b) => b.score - a.score);
    const paginatedScores = scores.slice((page - 1) * 20, page * 20);
    res.json(paginatedScores);
});

//  **Start/Stop Server for Testing**
let serverInstance = null;
module.exports = {
    start: function () {
        serverInstance = app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`);
        });
    },
    close: function () {
        if (serverInstance) serverInstance.close();
    },
};
