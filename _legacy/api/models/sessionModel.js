const mongoose=require('mongoose');



const sessionSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    chatbotId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,  // currently  used as the owner id  of the chatbot
        ref:"User"
    },
    messages:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Message"
        }
    ],
    createdAt:{
        type: Date,
        default: Date.now,
    }
});


const Session=mongoose.model("Session",sessionSchema);


module.exports=Session;