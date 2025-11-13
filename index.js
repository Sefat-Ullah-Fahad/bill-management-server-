

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()



const app = express();
const port = process.env.PORT || 2000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.okhtwbu.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    console.log("✅ MongoDB Connected");

    const db = client.db("bills_db");
    const billsCollection = db.collection("add_bills");
    const myBillsCollection = db.collection("myBills");
    const paymentsCollection = db.collection("payments");

    // ===================== //
    // 📌 Public Bills APIs  //
    // ===================== //

    // ✅ Get all bills
    app.get("/bills", async (req, res) => {
      try {
        const category = req.query.category;
        const query = category && category !== "All" ? { category } : {};
        const bills = await billsCollection.find(query).sort({ _id: -1 }).toArray();
        res.send(bills);
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch bills" });
      }
    });

    // ✅ Get last 6 bills
    app.get("/bills/recent", async (req, res) => {
      const bills = await billsCollection.find().sort({ _id: -1 }).limit(6).toArray();
      res.send(bills);
    });

    // ✅ Get bill by ID
    app.get("/bills/:id", async (req, res) => {
      const bill = await billsCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(bill);
    });


    app.put("/myBills/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    // ❌ Prevent updating `_id`
    if ("_id" in updatedData) {
      delete updatedData._id;
    }

    let query = {};

    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { id: id };
    }

    const result = await myBillsCollection.findOneAndUpdate(
      query,
      { $set: updatedData },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).send({ error: "Bill not found" });
    }

    res.send(result);

  } catch (error) {
    console.log("Update Error:", error);
    res.status(500).send({ error: "Update failed" });
  }
});

    // ✅ Insert multiple bills (Seed)
    app.post("/bills/seed", async (req, res) => {
      const result = await billsCollection.insertMany(req.body);
      res.send({ message: "Seed Data Added ✅", inserted: result.insertedCount });
    });

    // ===================== //
    // 👤 My Bills APIs      //
    // ===================== //

    // ✅ Get my bills
    app.get("/myBills", async (req, res) => {
      const email = req.query.email;
      const bills = await myBillsCollection.find({ email }).sort({ _id: -1 }).toArray();
      res.send(bills);
    });

    // ✅ Pay Bill / Save bill
    app.post("/myBills", async (req, res) => {
      try {
        const billData = req.body;
        const result = await myBillsCollection.insertOne(billData);
        res.status(201).send({ ...billData, _id: result.insertedId });
      } catch {
        res.status(500).send({ error: "Failed to save bills" });
      }
    });

    // ✅ Save payment & (future use)
    app.post("/payments", async (req, res) => {
      try {
        const payment = await paymentsCollection.insertOne(req.body);
        res.send(payment);
      } catch {
        res.status(500).send({ message: "Error saved payment" });
      }
    });

    // ✅ Update my paid bill {Fixed}
    app.put("/myBills/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await myBillsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updatedData },
          { returnOriginal: false } // ✅ MongoDB Driver v6 Fix
        );

        if (!result.value) {
          return res.status(404).send({ error: "Bill not found" });
        }

        res.send(result.value);
      } catch (error) {
        console.log(error);
        res.status(500).send({ error: "Update failed" });
      }
    });

    // ✅ Delete bill
    app.delete("/myBills/:id", async (req, res) => {
      const result = await myBillsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      result.deletedCount > 0
        ? res.send({ message: "Bill deleted ✅" })
        : res.status(404).send({ error: "Bill not found" });
    });

  } catch (err) {
    console.log(err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bill Server Running ✅");
});

app.listen(port, () => console.log(`🚀 Server running at port ${port}`));
