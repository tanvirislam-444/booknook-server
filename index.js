import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors'
import 'dotenv/config'
import { createRemoteJWKSet, jwtVerify } from 'jose';
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
const borrowCollection = db.collection('borrowbooks')

const verifyToken = async(req,res,next)=>{
    const authHeader = req.headers.authorization;
   
    if(!authHeader){
        return res.status(401).send({msg:"Unauthorized"})

    }
     
    const token =authHeader.split(" ")[1]
   if(!token){
    return res.status(401).send({msg:"Unauthorized"})
   }

   const JWKS = createRemoteJWKSet (new URL('http://localhost:3000/api/auth/jwks'))

   try{
    const {payload} = await jwtVerify(token,JWKS)
    next()
   }catch (error){
    return res.status(500).send({msg:"Server Error"})
   }
     
}

//verify done for add book
app.post('/books',verifyToken,async(req,res)=>{
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
//my books verify done
app.get('/my-books',verifyToken, async (req, res) => {
  const email = req.query.email;
  const result = await addBookCollection.find({ userEmail: email }).toArray();
  res.send(result);
});
 
//books details page verifyed
app.get('/books/:id',verifyToken, 
    async(req,res)=>{
    const {id} = req.params
    const result = await addBookCollection.findOne({_id: new ObjectId(id)})
    res.send(result)
})
//edit my book verifyed
app.patch('/books/:id',verifyToken, async(req,res)=>{
    const {id}= req.params
    const data= req.body
    const result = await addBookCollection.updateOne(
        {_id:new ObjectId(id)},
        {$set:data}
    )
    res.json(result)
})

//delete my book verifyed
app.delete('/books/:id',verifyToken,async(req,res)=>{
        const {id}= req.params
    const result = await addBookCollection.deleteOne(
        {_id:new ObjectId(id)},
   
    )
    res.json(result)
})
//my borrow books verifyed
app.post('/borrows',verifyToken,async(req,res)=>{
    const data = req.body
        const book = await addBookCollection.findOneAndUpdate(
      {
        _id: new ObjectId(data.bookId),
        totalCopies: { $gt: 0 }
      },
      {
        $inc: { totalCopies: -1 }
      },
      {
        returnDocument: 'after'
      }
    );

    if (!book) {
      return res.status(400).json({
        message: 'Book is currently unavailable'
      });
    }
 const result = await borrowCollection.insertOne({
  ...data,
  status: "borrowed"
});

res.send({
  success: true,
  message: "Book borrowed successfully",
  remainingCopies: book.totalCopies,
  borrowId: result.insertedId
});
})

//get my borrow books verifyed
app.get('/borrows', async (req, res) => {
  const email = req.query.email;
  const result = await borrowCollection.find({ userEmail: email }).toArray();
  res.send(result);
});

//remove my borrow books verifyed
app.delete('/borrows/:id',verifyToken, async (req, res) => {
      const { id } = req.params;
    const borrow = await borrowCollection.findOne({
      _id: new ObjectId(id)
    });
    const result = await borrowCollection.deleteOne({
      _id: new ObjectId(id),
      status: { $ne: "returned" }
    });

    await addBookCollection.updateOne(
      { _id: new ObjectId(borrow.bookId) },
      { $inc: { totalCopies: 1 } }
    );
    res.send(result)
  })


app.get('/',(req,res)=>{
    res.send({message:'server is running'})
})

app.listen(PORT,()=>{
console.log(`server is running port ${PORT}`)
})
