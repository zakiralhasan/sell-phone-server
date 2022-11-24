const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb'); //used for mongDB
const port = process.env.PORT || 5000;

//used for .env file 
require("dotenv").config();

// midleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.krkb3gw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db('sellPhone').collection('users')

        // Save user information to the user collection
        app.post('/users', async (req, res) => {
            const userInfo = req.body
            console.log(userInfo)
            const result = await usersCollection.insertOne(userInfo)
            console.log(result)
            res.send(result)
        })
    }
    finally {

    }
}

//called run() function, which working for store and get data from mongoDB
run().catch(error => console.log(error));


app.get("/", (req, res) => {
    res.send("Sell Phone server is running");
});

app.listen(port, () => {
    console.log("server is running on port:", port);
});