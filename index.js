import express from 'express';
import cors from 'cors';
import {Server} from 'socket.io';
import http from 'http';
import { connect } from './config.js';
import { chatModel } from './chat.Schema.js';

const app=express();

const server=http.createServer(app);

const io=new Server(server,{
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
})

let users={}
let profilePictures = {
    1:'https://img.freepik.com/premium-vector/retro-vintage-hand-drawn-flat-stylish-mascot-cartoon-character-drawing-sticker-icon-concept-isolated_730620-404578.jpg?size=626&ext=jpg',
    2:'https://img.freepik.com/premium-photo/profile-icon-white-background_941097-161433.jpg?size=626&ext=jpg',
    3:'https://img.freepik.com/free-photo/portrait-man-cartoon-style_23-2151133971.jpg?t=st=1718475146~exp=1718478746~hmac=6cdcc3f0d7409a08dcf783fd875c57437fcf0536f92896c67c4018223baa8ce6&w=1380',
    4:'https://img.freepik.com/free-photo/3d-illustration-young-businessman-with-glasses-beard_1142-51491.jpg?size=626&ext=jpg&ga=GA1.1.2020640171.1718464429&semt=ais_user',
    5:'https://img.freepik.com/free-photo/portrait-businessman-cartoon-style_23-2151133960.jpg?size=626&ext=jpg&ga=GA1.1.2020640171.1718464429&semt=ais_user',
    6:'https://img.freepik.com/free-psd/3d-illustration-with-online-avatar_23-2151303097.jpg?size=626&ext=jpg&ga=GA1.1.2020640171.1718464429&semt=ais_user',
    7:'https://img.freepik.com/free-photo/3d-portrait-businessman_23-2150793879.jpg?size=626&ext=jpg&ga=GA1.1.2020640171.1718464429&semt=ais_user',
    8:'https://img.freepik.com/premium-vector/boys-are-relaxing-laughing-happily-art-illustrations_334639-21.jpg?size=626&ext=jpg&ga=GA1.1.2020640171.1718464429&semt=ais_user',
    9:'https://img.freepik.com/premium-vector/happy-boy-wearing-raincoat-hand-drawn-mascot-cartoon-character-sticker-icon-concept-isolated_730620-447075.jpg?size=626&ext=jpg&ga=GA1.1.2020640171.1718464429&semt=ais_user',
    10:'https://img.freepik.com/free-photo/3d-illustration-cute-cartoon-boy-with-backpack-his-back_1142-40542.jpg?size=626&ext=jpg&ga=GA1.1.2020640171.1718464429&semt=ais_user',
}

io.on('connection',(socket)=>{
    console.log('Connection is established')
    socket.on("join", (data) => {
        socket.username = data;
        const val = Math.floor(Math.random() * 10) + 1;
        const pic = profilePictures[val];
        users[socket.id]={ username:data, pic:pic };

        // Emit the list of users to all clients
        io.emit('update_user_list', Object.values(users));

        socket.emit('profile_picture', pic);

        // send old messages to the clients.
        chatModel.find().sort({ timestamp: 1 }).limit(50)
            .then(messages => {
                socket.emit('load_messages', messages);
            }).catch(err => {
                console.log(err);
            })
    });

    socket.on('new_message', (message) => {
        const user = users[socket.id];
        let userMessage = {
            username: socket.username,
            message: message,
            timestamp: new Date(),
            image:user.pic
        }

        const newChat = new chatModel(userMessage);
        newChat.save();

        // broadcast this message to all the clients.
        socket.broadcast.emit('broadcast_message', userMessage);
    })

    socket.on('typing', () => {
        socket.broadcast.emit('user_typing', socket.username);
    });

    socket.on('stop_typing', () => {
        socket.broadcast.emit('user_stop_typing', socket.username);
    });
    socket.on('disconnect', () => {
        console.log("Connection is disconnected");
        delete users[socket.id];
        io.emit('update_user_list', Object.values(users));
    })
})

server.listen(3000, () => {
    console.log("App is listening on 3000");
    connect()
})
