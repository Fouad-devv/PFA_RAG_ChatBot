
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";


//________________ Get response for a user message _____________________________
export const handGetResponse = async (req, res) => {
  try {
    const userId = req.userId; // from token middleware
    const { message, conversationId } = req.body;

    // Validate input to avoid saving empty messages (Mongoose 'required' fails on empty string)
    if (!message || (typeof message === 'string' && message.trim().length === 0)) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Find or create Mongo user
    let user = await User.findOne({ userId });

    if (!user) {
      user = await User.create({
        userId: userId,
        email: req.email || '',
        username: req.username || '',
        roles: req.roles,
      });
    }

    // Find or create conversation
    let conversation;

    if (!conversationId) {
      conversation = await Conversation.create({
        userId: user._id,
        title: message.substring(0, 40),
        lastMessagePreview: "",
      });
    } else {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: user._id,
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (conversation.title === "New Conversation") {
        conversation.title = message.substring(0, 40);
        /* for API to get a title
        try {
        // Example: call a free summarization API to generate a title
        const apiRes = await fetch("https://api.summarizebot.com/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-Key": process.env.SUMMARIZEBOT_KEY, // your API key
          },
          body: JSON.stringify({
            text: message,
            summary_type: "short", // ask for short summary
          }),
        });

        const data = await apiRes.json();
        if (data.summary && data.summary.length > 0) {
          conversation.title = data.summary.substring(0, 40); // limit length
        } else {
          conversation.title = message.substring(0, 40); // fallback
        }
      } catch (err) {
        console.error("Title generation API failed", err);
        conversation.title = message.substring(0, 40); // fallback
      }
      }*/
      }
    }

    // Save user message
    await Message.create({
      conversationId: conversation._id,
      userId: user._id,
      role: "user",
      content: message,
    });

    
    const answer = "hello world";

    // Save assistant message
    await Message.create({
      conversationId: conversation._id,
      userId: user._id,
      role: "assistant",
      content: answer,
    });

    // Update last message preview
    conversation.lastMessagePreview = answer.substring(0, 60);
    await conversation.save();

    // Send response
    res.json({
      conversationId: conversation._id,
      answer,
      title: conversation.title,
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};






//________________ Get conversation history _____________________________
export const handGetHistory = async (req, res) => {
  
  const userId = req.userId;
  const email = req.email;
  const username = req.username;
  const roles = req.roles;

  let foundUser = await User.findOne({ userId });

  if (!foundUser) {
    foundUser = await User.create({ userId, email, username , roles });
  }

  const conversations = await Conversation.find({ userId: foundUser._id })
    .sort({ updatedAt: -1 })
    .select("_id title lastMessagePreview updatedAt");
  
  if (!conversations || conversations.length === 0) {
    return res.status(200).json(conversations || []);
  }

  return res.json(conversations);

};




// ________________ Get conversation details and messages _____________________________-
export const handGetConversation = async (req, res) => {

  try {

    const userId = req.userId;
    const { conversationId } = req.params;

    const foundUser = await User.findOne({ userId });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: foundUser._id,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Get messages sorted by createdAt
    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    // Return JSON
    return res.json({
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        lastMessagePreview: conversation.lastMessagePreview,
        updatedAt: conversation.updatedAt,
      },
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  };

};





//________________ Create a new conversation _____________________________________________
export const handleNewConversation = async (req, res) => {
  try {
    const userId = req.userId; 
    const email = req.email ;
    const username = req.username ;
    const roles = req.roles;
    const { message } = req.body; 

    // Find or create user
    let user = await User.findOne({ userId });
    if (!user) {
      user = await User.create({ userId, email, username , roles});
    }

    // Create new conversation
    const conversation = await Conversation.create({
      userId: user._id,
      title: "New Conversation",
      lastMessagePreview: "",
    });

    let initialMessage = null;

    // If message is provided, save it as the first assistant message
    if (message) {
      const assistantMsg = await Message.create({
        conversationId: conversation._id,
        userId: user._id,
        role: "assistant",
        content: message, // or "Hello!" default
      });
      initialMessage = assistantMsg.content;
    }

    // Return response to frontend
    res.json({
      conversationId: conversation._id,
      title: conversation.title,
      initialMessage, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};





// ____________________________ Delete a conversation ____________________________
export const handleDeleteConversation = async (req, res) => {

  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    const foundUser = await User.findOne({ userId });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found" });
    }

    //found conversation
    const conversation = await Conversation.findOne({ _id: conversationId, userId: foundUser._id});
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    await Conversation.deleteOne({ _id: conversationId });
    await Message.deleteMany({ conversationId: conversation._id });

    return res.json({ message: "Conversation deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  };

}
