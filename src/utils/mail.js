import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import dotenv from "dotenv";                
dotenv.config({
    path: "./.env",
});


const sendEmail= async (option) => {
   const mailGenerator= new Mailgen(
        {
            theme: "default",
            product: {
                name: "rizwan app",
                link: "https://rizwan.app"  
            }
        }
    )
    const emailTextual = mailGenerator.generatePlaintext(option.mailgenContent)
    const emailHtml = mailGenerator.generate(option.mailgenContent)

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS 
        }
    });
    const mail = {
        from: 'Rizwan@app.com',
        to: option.email,
        subject: option.subject,
        text: emailTextual, 
        html: emailHtml,
    }
    try {await transporter.sendMail(mail)
        
    } catch (error) {
        console.log("email sending failed",error)
    }
}

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: 'Welcome! We\'re very excited to have you on board.',
            action: {
                instructions: 'To get started with us, please click here:',
                button: {
                    color: '#22BC66', 
                    text: 'Confirm your account',
                    link: verificationUrl
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: 'We recived a request to reset your password',
            action: {
                instructions: 'To reset Password, please click here:',
                button: {
                    color: '#22BC66',
                    text: 'reset password',
                    link: passwordResetUrl
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}

export { forgotPasswordMailgenContent, emailVerificationMailgenContent,sendEmail };