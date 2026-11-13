import prisma from "../config/database.js";
import { LoginInput, RegisterInput } from "../utils/auth.validation.js";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

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

export const loginUser = async (credentials: LoginInput) => {
    const email = credentials.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
        },
    });

    if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
        throw new Error("Invalid email or password");
    }

    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN;
    if (!secret || !expiresIn) {
        throw new Error("JWT configuration is missing");
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        secret,
        { expiresIn: expiresIn as SignOptions["expiresIn"] },
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    };
};
