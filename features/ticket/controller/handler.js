const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const validateOrders = async (req, res) => {
  const { order_ids } = req.body; 

  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        transaction_id: {
          in: order_ids,
        },
      },
      include: {
        transaction: {
          include: {
            destination: true,
          },
        },
      },
    });

    res.json(tickets);
  } catch (error) {
    console.error("Error validating tickets:", error);
    res.status(500).json({ error: "Error validating tickets" });
  }
};

module.exports = {
  validateOrders,
};
