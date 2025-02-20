
const login=async (req,res) => {
    try {
        const {email,password}=req.body
        console.log(email);
        console.log(password);
        return res.redirect("/")
    } catch (error) {
       console.log("error occured while login time",error); 
    }
}

const register=async (req,res) => {
    try {
        const {}=req.body
        console.log("req.body:",req.body);
        return res.redirect('/')
    } catch (error) {
        console.log("error occured while registering new user",error);
    }
}




const loadHome=async (req,res) => {
    try {
        return res.render('home')
    } catch (error) {
        console.log("error rendering home page",error);
    }
}

const loadLogin=async (req,res) => {
    try {
        return res.render("login")
    } catch (error) {
        console.log("error rendering login page",error);
    }
}

const loadRegister=async (req,res) => {
    try {
        return res.render('signup')
    } catch (error) {
        console.log("error rendering signup page",error);
    }
}

module.exports={
    loadHome,
    loadLogin,
    login,
    loadRegister,
    register
}