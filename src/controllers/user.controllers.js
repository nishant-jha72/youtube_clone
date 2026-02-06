import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";
// temp

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
export { registerUser };
