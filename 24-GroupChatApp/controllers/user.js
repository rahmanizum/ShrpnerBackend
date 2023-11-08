const User = require('../models/users');
const ChatHistory = require('../models/chat-history')
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;



exports.userSignup = async (request, response, next) => {
    try {
        const { name, email, phonenumber, password } = request.body;
        let userExist = await User.findOne({
            where: {
                [Op.or]: [{ email }, { phonenumber }]
            }
        });
        if (!userExist) {
            const hash = await bcrypt.hash(password, 10);
            const user = await User.create({ name, email, phonenumber, password: hash });
            const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
            response.cookie('token', token, { maxAge: 3600000 });
            return response.status(201).json({ message: "user Account created successfully" });
        } else {
            return response.status(409).json({ message: 'Email or Phone Number already exist!' })
        }


    } catch (error) {
        console.log(error);
    }
}
exports.userSignin = async (request, response, next) => {
    try {
        const { email, password } = request.body;
        let userExist = await User.findOne({ where: { email } })
        if (userExist) {
            const isPasswordValid = await bcrypt.compare(password, userExist.password);
            if (isPasswordValid) {
                const token = jwt.sign({ userId: userExist.id }, secretKey, { expiresIn: '1h' });
                response.cookie('token', token, { maxAge: 3600000 });
                return response.status(201).json({ message: "Username and password correct" })
            } else {
                return response.status(401).json({ message: 'Invalid Password!' })
            }
        } else {
            return response.status(409).json({ message: 'Account is not exist!' })
        }


    } catch (error) {
        console.log(error);
    }
}

exports.saveChatHistory = async(request,response,next) => {
    try {
        const user = request.user;
        const {message}=request.body;
        await user.createChatHistory({
            message
        })
        return response.status(200).json({ message: "Message saved to database succesfully" })
        
    } catch (error) {
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}

exports.getUserChatHistory = async (request,response,next) => {
    try {
        const user=request.user;
        const chatHistories=await user.getChatHistories();
        return response.status(200).json({chat:chatHistories,message:"User chat History Fetched"})
        
    } catch (error) {
        return response.status(500).json({ message: 'Internal Server error!' })  
    }
}
exports.getAllChatHistory = async (request,response,next) => {
    try {
        const lastMessageId = request.query.lastMessageId||0;
        const chatHistories=await ChatHistory.findAll({
            offset:Number(lastMessageId),
            include: [
              {
                model: User, 
                attibutes:['id','name','date_time'] 
              }
            ],
            order: [['date_time', 'ASC']],
          });
          const chats = chatHistories.map((ele)=>{
            const user = ele.User;
            return{
                messageId:ele.id,
                message:ele.message,
                name:user.name,
                userId:user.id,
                date_time:ele.date_time
            }
          })
        return response.status(200).json({chats,message:"User chat History Fetched"})
        
    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })  
    }
}
exports.getcurrentuser = async (request, response, next) => {
    const user = request.user;
    response.json({userId:user.id});
}