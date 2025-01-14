const express = require("express");
const { UserModel, TodoModel } = require("./db");
const { auth, JWT_SECRET } = require("./auth");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { z } = require("zod");

mongoose.connect("Your mongo db connection string") // generate a secret key from mongodb compass and paste it

const app = express();
app.use(express.json());

app.post("/signup", async function(req, res) {

    const requiredBody = z.object({
        email: z.string,
        name: z.string,
        password: z.string.min(3).max(100)
    })
    const parsedDataWithSuccess = requiredBody.getParse(req.body);

    if (!parsedDataWithSuccess) {
        res.json({
            message: "Invalid format",
            error: parsedDataWithSuccess.error
        });
        return;
    }

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    //promify the fs func call

    const hashedPassword = await bcrypt.hash(password, 5);
    console.log(hashedPassword)

    await UserModel.create({
        email: email,
        password: password,
        name: name
    });
    
    res.json({
        message: "You are signed up"
    })
});


app.post("/signin", async function(req, res) {

    const email = req.body.email;
    const password = req.body.password;

    const response = await UserModel.findOne({
        email: email,
        password: password
    });

    if(!response){
        res.status(403).json({
            message: "user does not exist in db"
        })
        return
    }

    const passwordMatch = bcrypt.compare(password, response.password);

    if (passwordMatch) {
        const token = jwt.sign({
            id: response._id.toString()
        }, JWT_SECRET);

        res.json({
            token
        })
    } 
    else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
});


app.post("/todo", auth, async function(req, res) {
    const userId = req.userId;
    const title = req.body.title;
    const done = req.body.done;

    await TodoModel.create({
        userId,
        title,
        done
    });

    res.json({
        message: "Todo created"
    })
});


app.get("/todos", auth, async function(req, res) {
    const userId = req.userId;

    const todos = await TodoModel.find({
        userId
    });

    res.json({
        todos
    })
});

app.listen(3000);