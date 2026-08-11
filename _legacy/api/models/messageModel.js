const mongoose=require('mongoose');



const messageSchema = new mongoose.Schema({
    message:{
        type: String,
        required: true,
    },
    sessionId:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        required: true,
    },
    chatbotId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:"User"
    },
    createdAt:{
        type: Date,
        default: Date.now,
    }
    
});

const Message=mongoose.model("Message",messageSchema);
    

module.exports=Message;