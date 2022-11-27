const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); //used for mongDB
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
        const bookingsCollection = client.db('sellPhone').collection('bookings')

        // Save user information to the user collection
        app.put('/users', async (req, res) => {
            const userInfo = req.body
            const email = req.body.email
            const filter = { email: email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: userInfo
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            const token = jwt.sign(userInfo, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            res.send({ result, token })
        })



        /**
         ************************** Seller section **************8 
         **/

        //get seller list from users collection on mongoDB
        app.get('/users/seller', async (req, res) => {
            const filter = { role: "Seller" };
            const result = await usersCollection.find(filter).toArray();
            res.send(result);
        })

        //verify seller
        app.put('/seller', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const options = { upsert: true }
            const updatedDoc = {
                $set: { verified: true }
            }
            const verifiedSeller = await productsCollection.updateMany(filter, updatedDoc, options)
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send({ result, verifiedSeller })
        })

        //delete single user from users collection on mongoDB
        app.delete('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })



        /**
         ************************** Buyer section **************8 
         **/

        //get buyer list from users collection on mongoDB
        app.get('/users/buyer', async (req, res) => {
            const filter = { role: "Buyer" };
            const result = await usersCollection.find(filter).toArray();
            res.send(result);
        })

        //delete single user from users collection on mongoDB
        app.delete('/buyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })

        /**
         ************************** Products section **************8 
         **/

        //get products data from products collection on mongoDB and used for advertise section
        app.get('/products', async (req, res) => {
            const filter = { advertise: true };
            const result = await productsCollection.find(filter).toArray();
            res.send(result);
        })

        //get single user products data from products collection on mongoDB
        app.get('/myProducts', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        //delete single product from product collection on mongoDB
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result)
        })

        //get single user products data from products collection on mongoDB
        app.put('/productAdvertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updatedDoc = {
                $set: { advertise: true }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //stor product at products collection on mongoDB
        app.post('/products', async (req, res) => {
            const productInfo = req.body;
            const result = await productsCollection.insertOne(productInfo);
            res.send(result);
        })

        //get products data category wise from products collection on mongoDB
        app.get('/category/:name', async (req, res) => {
            const category = req.params.name;
            const query = { category: category };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })


        /**
        ************************** Bookings section **************
         **/

        //stor product at products collection on mongoDB
        app.post('/bookings', async (req, res) => {
            const bookingInfo = req.body;
            const filter = {
                bookingID: bookingInfo.bookingID,
            }
            const bookedProduct = await bookingsCollection.findOne(filter);
            if (bookedProduct) {
                return res.send({ message: 'This product is already booked!' })
            }
            console.log(bookingInfo)
            const result = await bookingsCollection.insertOne(bookingInfo);
            res.send(result);
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