const User = require("../../models/userSchema");
const Address=require("../../models/addressSchema")
const Orders=require("../../models/orderSchema")
const bcrypt=require('bcrypt')
const fs = require('fs');
const path = require('path');


const updateProfile = async (req, res) => {
  try {
    
    const { username, email, number, dob } = req.body;
    const userId = req.session.userId;
    
    
    const updateData = {
      username: username,
      email: email,
      number: number,
      dob: dob
    };
    
    // Only add the image if files were uploaded
    if (req.files && req.files.length > 0) {
      const image = req.files.map((file) => file.path);
      updateData.profileimage = image;
    }
    
    await User.updateOne({_id: userId}, {$set: updateData});

    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// New function to handle cropped profile image updates
const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }
    
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Delete previous profile image if it exists
    if (user.profileimage && user.profileimage.length > 0) {
      user.profileimage.forEach(imagePath => {
        try {
          // Check if file exists before attempting to delete
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (err) {
          console.log("Error deleting old profile image:", err);
        }
      });
    }
    
    // Save the new image path
    const imagePath = req.file.path;
    user.profileimage = [imagePath];
    await user.save();
    
    // Return success response with image URL
    // The path needs to be converted to a URL the browser can access
    const imageUrl = '/' + imagePath.replace(/\\/g, '/');
    
    res.json({ 
      success: true, 
      message: "Profile image updated successfully", 
      imageUrl: imageUrl
    });
    
  } catch (error) {
    console.log("Error updating profile image:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update profile image"
    });
  }
};


const changeNewPassword=async (req,res) => {
  try {
    console.log(req.body);

    const {currentPassword,newPassword,confirmPassword}=req.body

    const user=await User.findOne({_id:req.session.userId})

    const isMatch=await bcrypt.compare(currentPassword,user.password) 

    if(!isMatch){
      req.flash('error_msg',"The current password is wrong")
      return res.redirect('/changenewpassword')
    }

    const HashedPassword=await bcrypt.hash(newPassword,10)

    await User.updateOne({_id:user._id},{$set:{password:HashedPassword}})

    res.redirect('/profile')

    console.log(user);

  } catch (error) {
    console.log(error);
  }
}




const loadProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId });
    
    // Add profileImage for the frontend if it exists
    if (user && user.profileimage && user.profileimage.length > 0) {
      user.profileImage = '/' + user.profileimage[0].replace(/\\/g, '/');
    }
    
    return res.render("profile", { user });
  } catch (error) {
    console.log("error rendering profile page", error);
  }
};

const loadEditprofile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId });
    
    // Add profileImage for the frontend if it exists
    if (user && user.profileimage && user.profileimage.length > 0) {
      user.profileImage = '/' + user.profileimage[0].replace(/\\/g, '/');
    }
    
    return res.render("editprofile", { user });
  } catch (error) {
    console.log(error);
  }
};

const loadOrder = async (req, res) => {
  try {
    const userId=req.session.userId
    const user = await User.findOne({ _id:userId });
    const orders=await Orders.find({userId}).sort({createdAt:-1})
    console.log("user",user);
    console.log("orders",orders);
    return res.render("order", { user ,orders});
  } catch (error) {
    console.log(error);
  }
};

const loadAddress = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const userId =req.session.userId
  
    const addressDoc = await Address.findOne({ userId: userId });

    const addresses = addressDoc ? addressDoc.address : [];

    return res.render("address", { user ,addresses});
  } catch (error) {
    console.log(error);
  }
};

const setDefault=async (req,res) => {
  try {
    const addressId=req.params.addressId
    const userId=req.session.userId

    await Address.updateMany(
      { userId:userId },
      { $set: { "address.$[].isDefault": false } }
    );
    
    // Then set the selected address as default
    await Address.updateOne(
      { userId: userId, "address._id": addressId },
      { $set: { "address.$.isDefault": true } }
    );
    res.redirect("/address")


  } catch (error) {
    console.log(error);
  }
}

const deleteAddress=async (req,res) => {
  try {
    const addressId=req.params.addressId

    await Address.updateOne({"address._id":addressId},{ $pull: { address: { _id: addressId } } })

    res.redirect("/address")

  } catch (error) {
    console.log(error);
  }
}

const loadChangeNewPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    return res.render("changepassword", { user });
  } catch (error) {
    console.log(error);
  }
};
const loadWallet = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    return res.render("wallet", { user });
  } catch (error) {
    console.log(error);
  }
};
const loadAddAddress = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const address={}
    return res.render("addaddress", { user,address });
  } catch (error) {
    console.log(error);
  }
};
const loadEditAddress = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const addressId=req.params.addressId
    
    const addressDoc=await Address.findOne({ "address._id":addressId},{ "address.$": 1 })

    const specificAddressIndex = addressDoc.address.findIndex(addr => 
      addr._id.toString() === addressId
    );
    
    if (specificAddressIndex === -1) {
      return res.status(404).send("Specific address not found");
    }

    const address=addressDoc;
    const specificAddress=addressDoc.address[specificAddressIndex]
    
    return res.render("editaddress", { user,address,specificAddress });
  } catch (error) {
    console.log(error);
  }
};


const editAddress=async (req,res) => {
  try {
    const { saveAs, name, email, number, houseName, street, city, state, pincode, country } =req.body
    const addressId=req.params.addressId
    const userId=req.session.userId
    const updatedAddress = await Address.findOneAndUpdate(
      {  userId: userId,"address._id": addressId },
      {
        $set: {
          "address.$.saveAs": saveAs,
          "address.$.name": name,
          "address.$.email": email,
          "address.$.number": number,
          "address.$.houseName": houseName,
          "address.$.street": street,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.pincode": pincode,
          "address.$.country": country
        }
      },
      { new: true }
    );
        console.log("updatedAddress",updatedAddress);
        res.redirect('/address')
  } catch (error) {
    console.log(error);
  }
}
const addAddress=async (req,res) => {
  try {
    
    const { saveAs, name, email, number, houseName, street, city, state, pincode, country } =req.body

    const newAddressData = {
      name,
      email,
      number,
      houseName,
      street,
      city,
      state,
      country,
      pincode,
      saveAs,
      isDefault: false
    };

    const existingAddress = await Address.findOne({ userId: req.session.userId });

     if (existingAddress) {
      // If user already has an address document, push the new address to the array
      existingAddress.address.push(newAddressData);
      await existingAddress.save();
    } else {
      // If this is the user's first address, create a new Address document
      const newAddress = new Address({
        userId: req.session.userId,
        address: [newAddressData]
      });
      await newAddress.save();
    }
    res.redirect("/address")
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  loadProfile,
  loadOrder,
  loadAddress,
  loadChangeNewPassword,
  loadEditprofile,
  updateProfile,
  updateProfileImage,
  loadWallet,
  loadAddAddress,
  addAddress,
  changeNewPassword,
  loadEditAddress,
  editAddress,
  setDefault,
  deleteAddress
};