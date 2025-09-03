import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// const healthcheck = async (req, res,next) => {
//     try {
//        res.status(400).json(new ApiResponse(200, { message: "Server is running" }))
//    } catch (error) {
//     next(error)
//    }
// }
const healthcheck = asyncHandler(async (req, res) => {
    res.status(400).json(new ApiResponse(200, { message: "Server is running" }))
})


export{healthcheck}