import { body } from "express-validator";

const userRegisterValidator = () => { 
    return [
        body("email").trim()
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username required")
            .isLowercase()
            .withMessage("username must be in lowercase")
            .isLength({ min: 3 })
            .withMessage("username must be atleast 3 char"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("password required"),
        body("fullName")
        .optional().trim()

    ]
}

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .isEmail()
            .withMessage("Email is invalid"),
        body("password").notEmpty()
        .withMessage("password is required")
    ]
}

export {
    userRegisterValidator,userLoginValidator
}