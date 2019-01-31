const express = require('express');
const bodyparser = require('body-parser');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');
const knex = require('knex');


const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : '******',
      database : 'smart-brain'
    }
  });



app.use(cors());
app.use(bodyparser.json());

var database =  {

    users: [
        {
            id:'123',
            name : 'John',
            email : 'john@gmail.com',
            password : 'cookies',
            entries : 0,
            joined : new Date()
        },
        {
            id:'124',
            name : 'Sally',
            email : 'sally@gmail.com',
            password : 'bananas',
            entries : 0,
            joined : new Date()
        }  
    ]
}


app.get('/',(req,res)=>{
    res.json(database.users)
})


app.post('/signin' , (req,res)=>{
    
console.log(req.body.password," is trying to signin");
   db.select('email','hash').from('login')
   .where('email','=' , req.body.email)
   .then(data =>{
       console.log("Password is ",data[0])
       const isValid = bcrypt.compareSync(req.body.password,data[0].hash);
       if(isValid)
       {
           return db.select('*').from('users')
                .where('email','=',req.body.email)
                .then(user =>{
                    
                    console.log(user[0],"now logs in at ", new Date())
                    res.json('success');
                })
                .catch(err => res.status(400).json('Wrong Credentials'))
       }
       else
       {
           res.status(400).json('Wrong Credentials');
       }
   }).catch(err => res.status(400).json('Wrong Credentials'))


})

app.post('/register',(req,res)=>{

    const {name,password,email} = req.body;
    const hash = bcrypt.hashSync(password,4);
    console.log(email," is trying to register");
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    email:loginEmail[0],
                    name:name,
                    joined:new Date()
                })
                .then(user => {
                    res.json(user[0])
                })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})


app.get('/profile/:id',(req,res)=>{
    const { id } = req.params;
    let found = false
    database.users.forEach(user =>{
        if(user.id===id)
        {
            found=true;
            return  res.json(user);
        }

    })
    if(found===false)
             res.json('not found')
    
}) 

app.put('/image',(req,res)=>{
    const { id } = req.body;
    db('user').where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entry =>{
        if(entry.length)
        res.status(200).send(entry[0])
        else
        res.status(400).send('id not found')
    })
    .catch(err =>{
        res.status(400).send("something's messed up at /image endpoint")
    })
})


app.listen(3000, ()=>{
    console.log('app has started');
})
