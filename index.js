const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
  console.log("MongoDB connected");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// Schema and Model
const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
})

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema]
})

const User = mongoose.model('User', userSchema)


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User({ username: req.body.username })
    await newUser.save()
    res.json({ username: newUser.username, _id: newUser._id })
  } catch (err) {
    res.status(500).send('Error creating user')
  }
});

// List all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id')
  res.json(users)
});

// Add excercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body
  const user = await User.findById(req.params._id)
  if (!user) return res.status(404).send('User not found')

  const exerciseDate = date ? new Date(date) : new Date()

  const exercise = {
    description,
    duration: parseInt(duration),
    date: exerciseDate
  }

  user.log.push(exercise)
  await user.save()

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  })
});

// Get logs with optional from, to, limit
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query
  const user = await User.findById(req.params._id)
  if (!user) return res.status(404).send('User not found')

  let logs = user.log

  if (from) {
    const fromDate = new Date(from)
    logs = logs.filter(log => log.date >= fromDate)
  }
  if (to) {
    const toDate = new Date(to)
    logs = logs.filter(log => log.date <= toDate)
  }
  if (limit) {
    logs = logs.slice(0, parseInt(limit))
  }

  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: logs.map(entry => ({
      description: entry.description,
      duration: entry.duration,
      date: entry.date.toDateString()
    }))
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
