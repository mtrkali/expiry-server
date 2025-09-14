const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000

//middleware --
app.use(cors())
app.use(express.json());
require('dotenv').config();



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rwjljqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const foodCollection = client.db('expiryFood').collection('foods')

    //foods get api --
    app.get('/foods', async(req, res)=>{
        const foods = await foodCollection.find().toArray();
        const today = new Date();

        const expiryChecked = foods.map(food =>{
            const isExpired = new Date(food.expiryDate)< today;
            return {...food,expired: isExpired}
        })
       res.send (expiryChecked);
    })

    //food post api --
    app.post('/foods', async(req, res) =>{
        const foodData = req.body;

        const today = new Date().toISOString().split('T')[0];
        foodData.expired = foodData.expiryDate < today;

        const result = await foodCollection.insertOne(foodData);
        res.send(result)
    })

    //get Single Food --
    app.get('/foods/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId (id)}
      const result = await foodCollection.findOne(query);
      res.send(result);
    })

    // add note to the single food
    app.patch('/foods/:id', async(req, res) =>{
      const id = req.params.id;
      const note = req.body;
      const query = {_id: new ObjectId(id)};
      const addedDoc = {
        $push:{
          notes: note
        }
      }
      const result = await foodCollection.updateOne(query, addedDoc);
      res.send(result);
    })
    



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('food expiry is cooking');
})
app.listen(port, ()=>{
    console.log(`expiry server running on Port ${port}`)
})