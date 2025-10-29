import { ObjectId } from "mongodb";

export interface IUser {
  _id?: ObjectId;
  email: string;
  password: string;
  name?: string;
  isEmailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB 集合名称
export const USER_COLLECTION = "users";

// 用户验证函数
export function validateUser(user: Partial<IUser>): string[] {
  const errors: string[] = [];
  
  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push("Invalid email format");
  }
  
  if (user.password && user.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  

  
  return errors;
}

// 创建用户的默认值
export function createUserDefaults(userData: Partial<IUser>): IUser {
  const now = new Date();
  return {
    email: userData.email!,
    password: userData.password!,
    name: userData.name || "",

    isEmailVerified: userData.isEmailVerified || false,
    resetPasswordToken: userData.resetPasswordToken,
    resetPasswordExpires: userData.resetPasswordExpires,
    createdAt: userData.createdAt || now,
    updatedAt: userData.updatedAt || now,
  };
}
