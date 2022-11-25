const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb'); //used for mongDB
const jwt = require('jsonwebtoken');// used for jwt token
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
        const productsCollection = client.db('sellPhone').collection('products')

        // Save user information to the user collection
        app.put('/users', async (req, res) => {
            const userInfo = req.body
            console.log(userInfo)
            const email = req.body.email
            console.log(email)
            const filter = { email: email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: userInfo
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            console.log(result)
            const token = jwt.sign(userInfo, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            res.send({ result, token })
        })

        //get products data from products collection on mongoDB
        app.get('/products', async (req, res) => {
            const query = {};
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        //stor product at products collection on mongoDB
        app.post('/products', async (req, res) => {
            const productInfo = req.body;
            console.log(productInfo)
            const result = await productsCollection.insertOne(productInfo);
            res.send(result);
            console.log(result)
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