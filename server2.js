

const express = require("express") ;



const app = express() ;

app.get('/',(req,res)=>{

    const rate = Math.random() * 100 ;

    return res.status(200).json({rate}) ;

});

app.listen(3002,()=>{
    console.log(` --- server started on port 3002 ---`)
})