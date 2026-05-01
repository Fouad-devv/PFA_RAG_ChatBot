
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import OpenAI from "openai";

const isGreeting = (message) => {
  return /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening|salut|bonjour|bonsoir|hola|ciao|yo|sup|what'?s up|hiya)\s*[!?.]*$/i.test(message.trim());
};

const generateTitle = async (userMessage) => {
  try {
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "Generate a short, descriptive title (3 to 6 words) for a conversation based on the user's first message. Return ONLY the title, no quotes, no punctuation at the end.",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 20,
      temperature: 0.5,
    });
    return res.choices[0].message.content.trim().substring(0, 60);
  } catch {
    return userMessage.substring(0, 40);
  }
};


//________________ Get response for a user message _____________________________
export const handGetResponse = async (req, res) => {
  try {
    const userId = req.userId;
    const { message, conversationId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Find or create Mongo user
    let user = await User.findOne({ userId });
    if (!user) {
      user = await User.create({ userId, email: req.email || '', username: req.username || '', roles: req.roles });
    }

    // Find or create conversation + generate title with Groq
    let conversation;
    if (!conversationId) {
      const title = isGreeting(message) ? "New Conversation" : await generateTitle(message);
      conversation = await Conversation.create({ userId: user._id, title, lastMessagePreview: "" });
    } else {
      conversation = await Conversation.findOne({ _id: conversationId, userId: user._id });
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.title === "New Conversation" && !isGreeting(message)) {
        conversation.title = await generateTitle(message);
      }
    }

    // Save user message
    await Message.create({ conversationId: conversation._id, userId: user._id, role: "user", content: message });

    // Call FastAPI RAG service
    let answer;
    try {
      const ragRes = await fetch(`${process.env.FASTAPI_URL || "http://localhost:8000"}/rag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message }),
      });
      const ragData = await ragRes.json();
      answer = ragData.answer || "Je n'ai pas pu générer une réponse.";
    } catch {
      answer = "Le service RAG est indisponible. Veuillez réessayer.";
    }

    // Save assistant message
    await Message.create({ conversationId: conversation._id, userId: user._id, role: "assistant", content: answer });

    conversation.lastMessagePreview = answer.substring(0, 60);
    await conversation.save();

    res.json({ conversationId: conversation._id, answer, title: conversation.title });

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


// ____________________________ Rename a conversation ____________________________
export const handleRenameConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    const foundUser = await User.findOne({ userId });
    if (!foundUser) return res.status(404).json({ error: "User not found" });

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId: foundUser._id },
      { title: title.trim().substring(0, 60) },
      { new: true }
    );

    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    return res.json({ _id: conversation._id, title: conversation.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
