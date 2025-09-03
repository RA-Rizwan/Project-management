import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false})
        return{accessToken,refreshToken}
    } catch (error) {
       throw new ApiError(500,"something went wrong with JWt auth") 
    }
    
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role } = req.body
    
    const existingUser = await User.findOne({
        $or :[{username},{email}]
    })
    if (existingUser) {
        throw new ApiError(409,"user already exsist",[])
    }
    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified:false

    })

})