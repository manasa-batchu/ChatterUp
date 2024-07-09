import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: Date,
    image:String
});

export const chatModel = mongoose.model("Chat", chatSchema);