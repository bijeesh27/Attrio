const User = require("../../models/userSchema");
const Address=require("../../models/addressSchema")
const fs = require('fs');
const path = require('path');


const updateProfile = async (req, res) => {
  try {
    console.log(req.body);
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

const loadProfile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    
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
    const user = await User.findOne({ email: req.session.email });
    
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
    const user = await User.findOne({ email: req.session.email });
    return res.render("order", { user });
  } catch (error) {
    console.log(error);
  }
};

const loadAddress = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const userId =req.session.userId
    console.log(req.session.userId);
    const addressDoc = await Address.findOne({ userId: userId });
    console.log("addresDoc",addressDoc);
    const addresses = addressDoc ? addressDoc.address : [];

    return res.render("address", { user ,addresses});
  } catch (error) {
    console.log(error);
  }
};

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

const addAddress=async (req,res) => {
  try {
    console.log(req.session.userId);
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
  addAddress
};