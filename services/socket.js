import { Chat, Message } from '../models/Models.js';

export const configureSockets = (io) => {
  // Simple map to track online status by userId
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user channel
    socket.on('setup', (userData) => {
      if (userData && userData.id) {
        socket.join(userData.id);
        onlineUsers.set(userData.id, socket.id);
        console.log(`User registered setup: ${userData.id}`);
        // Broadcast user status
        io.emit('userStatusChanged', { userId: userData.id, status: 'online' });
      }
    });

    // Join room
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room: ${chatId}`);
    });

    // Handle incoming message
    socket.on('sendMessage', async (messageData) => {
      const { chatId, senderId, text, images, quotation } = messageData;
      try {
        // Save to DB
        const message = await Message.create({
          chatId,
          senderId,
          text: text || '',
          images: images || [],
          quotation: quotation || null
        });

        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: text || (quotation ? 'Sent a quotation' : 'Sent an image'),
          updatedAt: new Date()
        });

        // Broadcast to chat room
        io.in(chatId).emit('messageReceived', message);
        console.log(`Message broadcast to room ${chatId}`);
      } catch (err) {
        console.error('Socket send message error:', err);
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      const { chatId, senderName } = data;
      socket.to(chatId).emit('typing', { chatId, senderName });
    });

    socket.on('stopTyping', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('stopTyping', { chatId });
    });

    // Read Receipts
    socket.on('readReceipt', async (data) => {
      const { chatId, userId } = data;
      try {
        await Message.updateMany(
          { chatId, senderId: { $ne: userId }, read: false },
          { read: true }
        );
        socket.to(chatId).emit('messagesRead', { chatId });
      } catch (err) {
        console.error('Read receipt DB error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Find userId for this socket
      let disconnectedUserId = null;
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        io.emit('userStatusChanged', { userId: disconnectedUserId, status: 'offline' });
      }
    });
  });
};
