require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcyrpt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");




require("./db/conn");
const Register = require("./models/registers");
const { urlencoded, response } = require("express");

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(static_path));

app.set("view engine", "hbs");
app.set("views", template_path);

hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/home", auth, (req, res) => {
    res.render("home");
});



// register validation
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const repassword = req.body.repassword;

        if (password === repassword) {
            const registerCustomer = new Register({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                repassword: req.body.repassword,
            })

            const token = await registerCustomer.generateAuthToken();

            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 300000),
                httpOnly: true
            });

            const registered = await registerCustomer.save();
            res.status(201).render("index");
        }
        else {
            res.send("password are not matching");
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

// login validation
app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const useremail = await Register.findOne({ email: email });

        const isMatch = bcyrpt.compare(password, useremail.password);

        const token = await useremail.generateAuthToken();

        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 300000),
            httpOnly: true
        });



        if (isMatch) {
            res.status(201).render("home");
        }
        else {
            res.render("login");
        }

    } catch (error) {
        res.status(400).send("invalid email");
    }
});


app.listen(port, () => {
    console.log(`server is running at port no. ${port}`);
})

