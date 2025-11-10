const exprees = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = exprees()
const port = process.env.PORT || 2000 

// middleware
app.use(cors())
app.use(exprees.json())


app.get('/', (req, res) => {
    res.send('bill server is running')
})


app.listen(port, () => {
    console.log(`Bill server is running: ${port}`)
})