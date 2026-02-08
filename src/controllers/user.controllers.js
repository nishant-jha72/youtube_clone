import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, error.message || "Internal Server Error");
  }
};


const registerUser = asyncHandler(async (req, res) => {
  console.log("BODY:", req.body);
console.log("FILES:", req.files);

  const { fullName, email, userName, password } = req.body;

  if ([fullName, email, userName, password].some((field) => !field)) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
  console.log("avatar loaded")
  console.log(avatarResponse)
  let coverImageResponse = null;
  if (coverImageLocalPath) {
    coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
  }

  const newUser = await User.create({
    fullName,
    email,
    userName: userName.toLowerCase(),
    password,
    avatar: avatarResponse.url,
    coverImage: coverImageResponse?.url || ""
  });

  const createdUser = await User
    .findById(newUser._id)
    .select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Unable to create user. Please try again later.");
  }
  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});
// console.log("User register page");

const loginUser = asyncHandler( async (req , res) => {
  const {email , password , userName} = req.body

  if(!email || !userName) {
    throw new ApiError(404 , "Please enter email or Username");
  }

   const userDetailes = await User.findOne({
    $or: [{ email }, { userName }]
  }).select("+password");

  if(!userDetailes) {
    throw new ApiError(404 , "User doesnot Found");
  }

  const isPassword = await userDetailes.isPasswordCorrect(password);

  if(!isPassword) {
    throw new ApiError(404 , "Password is Wrong");
  }


  const {accessToken , refreshToken} = await generateAccessAndRefreshToken(userDetailes._id);

  const loggedInUser = await User.findById(userDetailes._id).select("-password -refreshToken");

  const options = {
    httpOnly : true ,
    secure : true
  }

  return res.status(200)
  .cookie("accessToken" , accessToken , options)
  .cookie("refreshToken" , refreshToken , options)
  .json(
    new ApiResponse(
      200,
      {
        user : loggedInUser , 
        accessToken ,
        refreshToken
      } ,
      "User Logged in succesFully"
    )
  )
});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
});

const refreshAccesToken = asyncHandler(async(req , res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
      throw new ApiError(401 , "Invalid Request");
    }

    const decodedToken = Jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)

    const user = User.findById(decodedToken?.userId);
    if(!user) {
      throw new ApiError(401 , "Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401 , "Invalid Token");
    }

    const options = {
        httpOnly: true,
        secure: true
    }
    const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id);

    return res
    .status(200)
    .cookie("accessToken",  accessToken,options)
    .cookie("refreshToken", newRefreshToken , options)
    .json(
      new ApiResponse(
        200 , 
        {
          accessToken ,
          refreshToken :  newRefreshToken } ,
           "Session Started Succesflly"
      )
    )
})

const changeOldPassword = asyncHandler(async(req , res)=> {
    const {oldPassword , newPassword} = req.body
    const user = await User.findById(req.user?.userId);

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect) {
      throw new ApiError(400 , "Wrong Password");
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})
    return res
    .status(200)
    .json(new ApiResponse (200 , {} , "Password Changed Succesfully"))
})

const getCurrentUser = asyncHandler(async(req , res) => {
  return res
  .status(200)
  .json(200 , req.user , "User get Succesfully")
})

const updateAccountDetailes = asyncHandler(async(req , res)=> {
  const {fullName , email} = req.body
  if(!fullName || !email) {
    throw new ApiError(400 , "Name Or Email Wrong");
  }

  const user = User.findByIdAndUpdate(req.user?._id,
    {
      $set :
       {
        fullName,
        email
       }
    }, 
    {
      new : true
    }
  ).select("-password")

  return res
  .status(200)
  .json(200 , user , "User Update SuccesFully")
})

const updateUserAvatar = asyncHandler(async(req , res)=> {
   const avatarLocalPath =  req.file?.path
   if(!avatarLocalPath) {
    throw new ApiError(400 , "Avatar Image is Required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url) {
    throw new ApiError(400 , "Error while Uploading Avatar On Cloudinary")
   }


   const user = await User.findByIdAndUpdate(req.user?._id , {
      $set : {
        avatar : avatar.url
      }
   } , {
    new : true
   }).select("-password");

   return res.status(200)
   .json(200 , user , 'Avatar Update SuccesFully')
})

const updateUserCoverImage = asyncHandler(async(req , res)=> {
   const coverImageLocalPath =  req.file?.path
   if(!coverImageLocalPath) {
    throw new ApiError(400 , "Cover Image is Required")
   }

   const avatar = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar.url) {
    throw new ApiError(400 , "Error while Uploading cover Image On Cloudinary")
   }


   const user = await User.findByIdAndUpdate(req.user?._id , {
      $set : {
        coverImage : avatar.url
      }
   } , {
    new : true
   }).select("-password");

   return res.status(200)
   .json(200 , user , 'cover Image Update SuccesFully')
})

const getUserChannelProfile = asyncHandler(async(req , res)=>{

  const {userName} = req.params
  if(!userName?.trim()) {
    throw new ApiError(400 , "userName Not Founded")
  }

  const channel =await User.aggregate([
    {
      $match : {
        userName : userName.toLowerCase()
      }
    } ,
    {
      $lookup :{
        from : "subscriptions" ,
        localField : "_id" ,
        foreignField : "channel",
        as : "Subscribers"
      }
    },
     {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
         {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
  ])
   if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                             foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export { registerUser  ,
          loginUser ,
          logoutUser ,
          changeOldPassword,
          refreshAccesToken ,
          getCurrentUser,
          updateAccountDetailes ,
          updateUserAvatar,
          updateUserCoverImage,
          getUserChannelProfile,
          getWatchHistory
};
