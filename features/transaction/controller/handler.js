const { PrismaClient } = require("@prisma/client");
const { CreateTransaction } = require("../../../config/midtrans");
const { randomID, randomTicket } = require("../../../helper/utils");
const prisma = new PrismaClient();

async function createTransaction(req, res) {
  const { name, phone, email, ticket_qty, date_booking, destination_id } =
    req.body;
  const price = ticket_qty * 35000;
  const transactionId = randomID();

  const snap_url = await CreateTransaction(transactionId, price);
  const isoDate = new Date(date_booking).toISOString();

  try {
    const transaction = await prisma.transaction.create({
      data: {
        id: transactionId,
        name: name,
        phone: phone,
        email: email,
        ticket_qty: ticket_qty,
        total_price: price,
        date_booking: isoDate,
        destination_id: destination_id,
        status: "Pending",
        snap_url: snap_url,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAllTransaction(req, res) {
  const { transaction_id } = req.body;

  if (!Array.isArray(transaction_id) || transaction_id.length === 0) {
    return res.status(200).json({ error: "Transaction not found" });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        id: {
          in: transaction_id,
        },
      },
      include: {
        destination: true,
      },
    });

    if (transactions.length === 0) {
      return res.status(404).json({ error: "No transactions found" });
    }

    const validatedTransactions = transactions.map((transaction) => ({
      ...transaction,
      date_booking: new Date(transaction.date_booking).toISOString(),
    }));

    res.status(200).json(validatedTransactions);
  } catch (error) {
    console.error("Error getting transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function webhook(req, res) {
  const { transaction_status, order_id, fraud_status } = req.body;

  let orderId = order_id;
  let transactionStatus = transaction_status;
  let fraudStatus = fraud_status;
  const ticketId = randomTicket();

  const date_booking = await prisma.transaction.findUnique({
    where: {
      id: orderId,
    },
  });
  console.log(date_booking.date_booking);
  var expiredAt = new Date(
    new Date(date_booking.date_booking).getTime() + 3 * 24 * 60 * 60 * 1000
  );

  if (transactionStatus == "capture") {
    if (fraudStatus == "accept") {
      // TODO set transaction status on your database to 'success'
      // and response with 200 OK
      prisma.transaction
        .update({
          where: {
            id: orderId,
          },
          data: {
            status: "Berhasil",
          },
        })
        .then(() => {
          console.log("Transaction successful");
        })
        .catch((error) => {
          console.log(error);
        });

      prisma.ticket
        .create({
          data: {
            transaction_id: orderId,
            ticket_id: ticketId,
            expired_at: expiredAt,
          },
        })
        .then(() => {
          res.status(200).json({ message: "Transaction successful" });
        })
        .catch((error) => {
          console.error("Error creating ticket:", error);
          res.status(500).json({ error: "Internal server error" });
        });
    }
  } else if (transactionStatus == "settlement") {
    // TODO set transaction status on your database to 'success'
    // and response with 200 OK
    const updateTransaction = await prisma.transaction.update({
      where: {
        id: orderId,
      },
      data: {
        status: "Berhasil",
      },
    });
    const createTicket = await prisma.ticket.create({
      data: {
        transaction_id: orderId,
        ticket_id: ticketId,
        expired_at: expiredAt,
      },
    });
    console.log(createTicket);
  } else if (
    transactionStatus == "cancel" ||
    transactionStatus == "deny" ||
    transactionStatus == "expire"
  ) {
    // TODO set transaction status on your database to 'failure'
    // and response with 200 OK
  } else if (transactionStatus == "pending") {
    // TODO set transaction status on your database to 'pending' / waiting payment
    // and response with 200 OK
  }
}
module.exports = { createTransaction, webhook, getAllTransaction };
