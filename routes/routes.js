const express = require('express');
const router = express.Router();
const { getAllDestination, getDestionationById } = require('../features/destination/controller/handler');
const { createTransaction, webhook, getAllTransaction } = require('../features/transaction/controller/handler');
const { validateOrders } = require('../features/ticket/controller/handler');
// Destination Route
router.get('/destinations', getAllDestination);
router.get('/destinations/:id', getDestionationById);
router.post('/transactions/validate', getAllTransaction);
router.post('/transactions', createTransaction);
router.post("/ticket", validateOrders)
router.post("/midtrans/notification", webhook)

module.exports = router;
