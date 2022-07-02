const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
const app = express();
const port = process.env.PORT || 5000;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secret = "test";

/* -------------------MiddleWare----------------*/

app.use(cors());
app.use(express.json());

/* -------------------End of MiddleWare----------------*/

/* -------------------MongoDB Connection----------------*/
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@restful-api.fdzsm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

/* ----------------End of MongoDB Connection----------------*/

/*---------CRUD Operation------------*/
async function run() {
    try {
        await client.connect();
        console.log('Database Connection Established!');

        const database = client.db("billings");
        const billingsCollection = database.collection("billings");
        const usersCollection = database.collection("users");



        /*-------------GET API--------------*/
        app.post('/billing-list', async (req, res) => {
            const filter = req.body;
            for (const key in filter) {
                if (filter[key] === "") {
                    delete filter[key];
                }
            }
            const cursor = billingsCollection.find(filter);
            const result = await cursor.toArray();
            res.status(200).json(result);
        })

        // get order by user email


        /*-------------end of GET API--------------*/

        /*--------POST API----------*/
        app.post('/add-billing', async (req, res) => {
            const billings = req.body;
            // console.log(course);
            const result = await billingsCollection.insertOne(billings);
            console.log(result);
            res.status(200).send(result);
        })

        // send user data to database



        /*--------end of POST API----------*/

        /*----------UPDATE API----------*/

        //course update route
        app.put("/update-billing/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const updateDoc = { $set: req.body };
            const result = await billingsCollection.updateOne(filter, updateDoc);
            res.status(200).send(result);
        });

        /*----------end of UPDATE API----------*/


        /*-----------Delete API----------*/
        app.delete("/delete-billing/:id", async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const result = await billingsCollection.deleteOne(query);
            res.status(200).send(result);
        })

        //auth api
        app.post("/registration", async (req, res) => {
            console.log('data hitted', req.body);
            const { email, password, firstName, lastName, phone, role } = req.body;

            try {
                const oldUser = await usersCollection.findOne({ email });

                if (oldUser) {
                    return res.status(400).json({ message: "User already exists" });
                }

                const hashedPassword = await bcrypt.hash(password, 12);

                const result = await usersCollection.insertOne({
                    email,
                    password: hashedPassword,
                    name: `${firstName} ${lastName}`,
                    phone,
                    role,
                });

                const token = jwt.sign({ email: result.email, id: result._id }, secret, {
                    expiresIn: "1h",
                });
                res.status(201).json({ result, token });
            } catch (error) {
                res.status(500).json({ message: "Something went wrong" });
                console.log(error);
            }
        })

        app.post('/login', async (req, res) => {
            console.log('hitted', req.body)
            const { email, password } = req.body;


            try {
                const oldUser = await usersCollection.findOne({ email });
                if (!oldUser)
                    return res.status(404).json({ message: "User doesn't exist" });

                const isPasswordCorrect = await bcrypt.compare(password, oldUser.password);

                if (!isPasswordCorrect)
                    return res.status(400).json({ message: "Invalid credentials" });

                const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
                    expiresIn: "1h",
                });

                res.status(200).json({ result: oldUser, token });
            } catch (error) {
                res.status(500).json({ message: "Something went wrong" });
                console.log(error);
            }
        })

        /*-----------end of Delete API----------*/
    } finally {

    }
}
run().catch(console.dir);
/*---------end of CRUD Operation------------*/


/* -------------------Page Initialization----------------*/

app.get('/', (req, res) => {
    res.send("Welcome to Billing Server!");
});

app.listen(port, () => {
    console.log("Server is running on PORT", port);
});

/* ---------------End of Page Initialization---------------*/