import {asyncHandler} from '../utils/AsyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';

import { ApiResponse } from '../utils/ApiResponse.js';
const registerUser = asyncHandler(async (req, res) => {
    const {fullName , email, username , password } = req.body;

    if(
        [fullName , email, username , password ].some(field => !field)
    ) {
        throw new ApiError(400 , "All fields are required");
    }

        const existingUser = await User.findOne({
            $or : [
                {email} ,
                {username}
            ]
        });
        if(existingUser) {
            throw new ApiError(409 , "User already exists with this email");
        }

        const avatarLocalPath = req.files?.avatar?[0]?.path : null;
        const coverImageLocalPath = req.files?.coverImage?[0]?.path : null;
        if(!avatarLocalPath) {
            throw new ApiError(400 , "Avatar image is required");
        }
        const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
        const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
        

        const newUser = await User.create({
            fullName,
            email,
            username : username.toLowerCase(),
            password,
            avatar : avatarResponse.url,
            coverImage : coverImageResponse.url
        });

        const createdUser = await newUser.findById(newUser._id).select('-password -refreshToken');
        if(!createdUser) {
            throw new ApiError(500 , "Unable to create user. Please try again later.");
        }
        res.status(201).json(new ApiResponse(200 , createdUser , "User registered successfully"));
    });
export { registerUser };