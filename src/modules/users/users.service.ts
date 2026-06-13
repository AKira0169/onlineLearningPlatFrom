import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppError } from '../../common/errors/app-error';

/** Port of `src/users/usersController.js`. */
@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<any>) {}

  async getAllUsers() {
    const users = await this.userModel.find().lean();
    if (!users || users.length === 0) {
      // Original called an undefined `next` here (latent ReferenceError); now a clean 404.
      throw new AppError('No users found', 404);
    }
    return { status: 'success', results: users.length, data: { users } };
  }

  async getUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new AppError(`User not found with id: ${id}`, 404);
    }
    return { status: 'success', data: { user } };
  }

  async updateUser(id: string, updates: Record<string, any>) {
    const user = await this.userModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw new AppError(`User not found with id: ${id}`, 404);
    }
    return { status: 'success', data: { user } };
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new AppError(`User not found with id: ${id}`, 404);
    }
    return { status: 'success', data: null };
  }
}
