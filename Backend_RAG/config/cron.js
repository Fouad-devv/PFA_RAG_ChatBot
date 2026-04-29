import cron from 'node-cron';
import Order from '../models/Order.js';

cron.schedule('0 0 * * *', async () => {
  // Runs every day at midnight
  const now = new Date();

  await Order.updateMany(
    {
      estimatedDeliveryDate: { $lte: now },
      status: { $ne: "delivered" }
    },
    { status: "delivered" }
  );

  console.log("Updated delivered orders");
});
