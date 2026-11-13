import prisma from "../config/database.js";
import { RegisterInput } from "../utils/auth.validation.js";
import bcrypt from "bcrypt"

export const registerUser = async (newUser: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: newUser.email,
        },
    });

    if(existingUser){
        throw new Error ("Email is already registered")
    }

    const hashedPass = await bcrypt.hash(newUser.password,10);

    try{
        const user = await prisma.user.create({
            data: {
                name:newUser.name,
                email:newUser.email,
                password:hashedPass,
            },select:{
                id:true,
                name:true,
                email:true,
                createdAt:true,
            },
        });

        return user;
    }catch(error){
        if(
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
      throw new Error("Email is already registered");
    }

    throw error;
    }
}