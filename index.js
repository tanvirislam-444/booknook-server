import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors'
import 'dotenv/config'
const app = express()
const PORT = 8000



app.use(cors())
app.use(express.json())
const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient=await connectToMongoDB()
const db = mongoClient.db("booknook")

const addBookCollection = db.collection('addbook')

app.post('/books',async(req,res)=>{
    const data = req.body
    const result = await addBookCollection.insertOne(data)
    console.log(result)
    res.send(result)
})

app.get('/books',async(req,res)=>{
    const result = await addBookCollection.find().toArray()
    res.send(result)
})

app.get('/books/latest-books', async (req, res) => {
  const result = await addBookCollection.find().sort({ createdAt: -1 }).limit(6).toArray();

  res.send(result);
})

app.get('/my-books', async (req, res) => {
  const email = req.query.email;
  const result = await addBookCollection.find({ userEmail: email }).toArray();
  res.send(result);
});

app.get('/books/:id',async(req,res)=>{
    const {id} = req.params
    const result = await addBookCollection.findOne({_id: new ObjectId(id)})
    res.send(result)
})



app.get('/',(req,res)=>{
    res.send({message:'server is running'})
})

app.listen(PORT,()=>{
console.log(`server is running port ${PORT}`)
})
