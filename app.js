const express=require('express')
const app=express()
require('dotenv').config()
const path=require('path')

const PORT = process.env.PORT

app.set("view engine", "ejs")

app.set("views", [
    path.join(__dirname, "src", "views", "user"),
    path.join(__dirname, "src", "views", "admin")
]);


app.use( express.static(path.join(__dirname,"public")));


// app.get('/',(req,res)=>{
//     res.render('add-product')
// })
app.get('/',(req,res)=>{
    res.render('home')
})
// app.get('/categories',(req,res)=>{
//     res.render('categories')
// })
// app.get('/checkout',(req,res)=>{
//     res.render('checkout')
// })
// app.get('/contact',(req,res)=>{
//     res.render('contact')
// })
// app.get('/404',(req,res)=>{
//     res.render('error-404')
// })
// app.get('/gallery',(req,res)=>{
//     res.render('gallery')
// })
// app.get('/login',(req,res)=>{
//     res.render('login')
// })
// app.get('/product',(req,res)=>{
//     res.render('product-page')
// })
// app.get('/signup',(req,res)=>{
//     res.render('signup')
// })
// app.get('/size',(req,res)=>{
//     res.render('sizing-guide')
// })
// app.get('/track',(req,res)=>{
//     res.render('track-order')
// })
// app.get('/shop',(req,res)=>{
//     res.render('single-product')
// })


app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`);
})