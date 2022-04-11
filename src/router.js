const controller = require('./controller')
const status = require('./status')
const router = require('express').Router()

// Add CORS headers
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// Log error to console but don't send it to the client to avoid leaking data
router.use((err, req, res, next) => {
  if (err) {
    console.error(err)
    return res.sendStatus(500)
  }
  next()
})

router.get('/', status.index)
router.get('/v1/status', status.status)
router.get('/v1/jobs/:id', status.getJob)
router.post('/v1/tornadoWithdraw', controller.tornadoWithdraw)
router.get('/status', status.status)
router.post('/relay', controller.tornadoWithdraw)

module.exports = router
