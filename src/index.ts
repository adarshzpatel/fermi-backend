
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3000;


// add body parser and cors 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
})

// crate a route for /market?addresss=1
app.get('/market/:address', (req, res) => {
  console.log(req.params);
  res.send('Market page');
})


app.get('/market', (req, res) => {
  const address = req.query.address;

  res.send(req.query.address);
})
