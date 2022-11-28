const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); //used for mongDB

const jwt = require('jsonwebtoken');// used for jwt token
const port = process.env.PORT || 5000;

require("dotenv").config();//used for .env file 

const stripe = require("stripe")(process.env.STRIPE_SECRET);//used for stripe

// midleware
app.use(cors({
    "origin": ['https://sell-phone-ccf88.web.app'],
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
}));
app.use(express.json());


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.krkb3gw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//this is actually a middle ware, which work for verifying jwt token
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' }) //second check
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'forbidden access' }) //third check
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const usersCollection = client.db('sellPhone').collection('users')
        const productsCollection = client.db('sellPhone').collection('products')
        const bookingsCollection = client.db('sellPhone').collection('bookings')
        const reportingsCollection = client.db('sellPhone').collection('reportings')
        const paymentsCollection = client.db('sellPhone').collection('payments')

        //this is an Buyer verify middle ware 
        const verifyBuyer = async (req, res, next) => {
            // console.log(req.decoded)
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Buyer') {
                return res.status(403).send({ message: 'forbidden access' }) //forth check
            }
            next()
        }
        //this is an Buyer verify middle ware 
        const verifySeller = async (req, res, next) => {
            // console.log(req.decoded)
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Seller') {
                return res.status(403).send({ message: 'forbidden access' }) //forth check
            }
            next()
        }
        //this is an Buyer verify middle ware 
        const verifyAdmin = async (req, res, next) => {
            // console.log(req.decoded)
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' }) //forth check
            }
            next()
        }

        /**
        ************************** User section **************8 
         **/
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

        //get user data from users collection to check user role
        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const result = await usersCollection.findOne(filter);
            res.send(result)
        })

        /**
         ************************** Seller section **************8 
         **/

        //get seller list from users collection on mongoDB
        app.get('/users/seller', verifyJWT, verifyAdmin, async (req, res) => {
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
        app.delete('/seller/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })



        /**
         ************************** Buyer section **************8 
         **/

        //get buyer list from users collection on mongoDB
        app.get('/users/buyer', verifyJWT, verifyAdmin, async (req, res) => {
            const filter = { role: "Buyer" };
            const result = await usersCollection.find(filter).toArray();
            res.send(result);
        })

        //delete single buyer from users collection on mongoDB
        app.delete('/buyer/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })

        //get buyer list from users collection on mongoDB
        app.get('/myBuyers', async (req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email };
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
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
        app.delete('/products/:id', verifyJWT, verifySeller, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result)
        })

        //get single user products data from products collection on mongoDB and used for show advertise
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
            const filtedResult = result.filter(flt => flt.payment !== true);
            res.send(filtedResult);
        })


        /**
        ************************** Bookings section **************
         **/

        //stor booking data at bookings collection on mongoDB
        app.post('/bookings', async (req, res) => {
            const bookingInfo = req.body;
            const filter = {
                bookingID: bookingInfo.bookingID,
            }
            const bookedProduct = await bookingsCollection.findOne(filter);
            if (bookedProduct) {
                return res.send({ message: 'This product is already booked!' })
            }
            const result = await bookingsCollection.insertOne(bookingInfo);
            res.send(result);
        })

        //get single buyer orders data from bookings collection on mongoDB
        app.get('/myOrders', verifyJWT, verifyBuyer, async (req, res) => {
            const email = req.query.email;
            const query = { buyerEmail: email };
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        })

        //delete order user from bookings collection on mongoDB
        app.delete('/myOrders/:id', verifyJWT, verifyBuyer, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bookingsCollection.deleteOne(filter);
            res.send(result)
        })



        /**
        ************************** Reportings section **************
        **/

        //get all reporting data from reportings collection on mongoDB
        app.get('/rportingItems', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {};
            const result = await reportingsCollection.find(query).toArray();
            res.send(result);
        })

        //stor reporting data at reportings collection on mongoDB
        app.post('/rportings', async (req, res) => {
            const reportingInfo = req.body;
            const result = await reportingsCollection.insertOne(reportingInfo);
            res.send(result);
        })

        //get single buyer reporting data from reportings collection on mongoDB
        app.get('/rportings', verifyJWT, verifyBuyer, async (req, res) => {
            const email = req.query.email;
            const query = { buyerEmail: email };
            const result = await reportingsCollection.find(query).toArray();
            res.send(result);
        })

        //delete reporting item from reportings collection on mongoDB
        app.delete('/rportings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await reportingsCollection.deleteOne(filter);
            res.send(result)
        })



        /**
         ************************** Payment section **************
        **/


        //get data from bookings collection by searching user id (it's used for payment handle)
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingsCollection.findOne(query);
            res.send(result)
        })

        //This API is used for stripe
        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            const price = booking.productPrice;
            const amount = parseFloat(price * 100)

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret });
        });


        //stored payment information on the data base
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);

            //used for booking collection
            const paymentId = payment.paymentId
            const filterBooking = { _id: ObjectId(paymentId) }
            const updatedDocBooking = {
                $set: {
                    payment: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResultBooing = await bookingsCollection.updateOne(filterBooking, updatedDocBooking)

            //used for product collection
            const porductId = payment.porductId
            const filterProduct = { _id: ObjectId(porductId) }
            const updatedDocProduct = {
                $set: {
                    payment: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await productsCollection.updateOne(filterProduct, updatedDocProduct)
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