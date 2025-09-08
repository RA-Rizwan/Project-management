import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";
import jwt from "jsonwebtoken";

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
        $or: [{username},{email}]
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
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()
    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry  

    await user.save({ validateBeforeSave: false })
    await sendEmail({
        email: user?.email,
        subject: "please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
           ` ${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });
    const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")
    if (!createdUser) {
        throw new ApiError(500,"Somthing went wrong while registering a user")
    }
    return res
        .status(201)
    .json(new ApiResponse(200,{user : createdUser},"User Registered Successfully and verificaton mail sent"))
})

const login = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body
    if (!email) {
        throw new ApiError(400, "email is required")
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(400, "user does not exsist")
    }
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "invalid credentials")
    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry")
    
    const options = {
        httpOnly:true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
            },"user logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            new: true
        },
    );
    const options = {
        httpOnly: true,
       secure: true 
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
        new ApiResponse(200,{},"user logged out")
    )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, req.user, "current User fetched SuccessFully"
            )
        );
})

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params
    if (!verificationToken) {
        throw new ApiError(400,"Email verificaton token is missing")
    }
    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex")
    
    await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry:{$gt:Date.now()}
    })

    if (!user) {
        throw new ApiError(400, "Token is invalid or expired")

    }
    user.emailVerificationToken = undefined
    user.emailVerificationExpiry=undefined
    user.isEmailVerified = true
    await use.save({ validateBeforeSave: false })
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, {
            isEmailVerified:true
        },"Email is verified"
    )
)
})
const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404,"user does not exsist")
    }
    if (user.isEmailVerified) {
        throw new ApiError(409, "Email already verified")

    }
    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()
    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })
    await sendEmail({
        email: user?.email,
        subject: "please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            ` ${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "mail has been sent to your email"
        )
    )
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401 ,"unauthorized access")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
       
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired")
        }
        const options = {
            httpOnly: true,
            secure:true
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id)
        user.refreshToken = newRefreshToken;
        await user.save()
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken: newRefreshToken },
                    "access token refresh"
                )
            )

    } catch (error) {
        throw new ApiError(401, "invalid refresh token")

    }
})

//const getCurrentUser = asyncHandler(async (req, res) => {})


export { registerUser,login,logoutUser,getCurrentUser,verifyEmail ,resendEmailVerification,refreshAccessToken };