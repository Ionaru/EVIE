// import * as bcrypt from 'bcryptjs';
// import { Request, Response } from 'express';
// import * as httpStatus from 'http-status-codes';
// import { logger } from 'winston-pnp-logger';
//
// import { User } from '../models/user.model';
// import { BaseRouter } from './base.router';
//
// export class UserRouter extends BaseRouter {
//
//     @BaseRouter.requestDecorator(BaseRouter.checkBodyParameters, 'username', 'email', 'password')
//     private static async createUser(request: Request, response: Response): Promise<Response> {
//
//         // Extract the form data from the request and trim the whitespace from the username and email.
//         const username: string = request.body.username.trim();
//         const email: string = request.body.email.trim();
//         const password: string = request.body.password;
//
//         const user: User | undefined = await User.doQuery()
//             .where('user.username = :username', {username})
//             .orWhere('user.username = :email', {email})
//             .orWhere('user.email = :username', {username})
//             .orWhere('user.email = :email', {email})
//             .getOne();
//
//         if (user) {
//             // The regular expression checks if the username or email matched the one from the user in the database
//             // this is done to return an accurate error message.
//             const existingUsername = new RegExp('^' + user.username + '$', 'i');
//             const existingEmail = new RegExp('^' + user.email + '$', 'i');
//             let usernameInUse = false;
//             let emailInUse = false;
//             if (username.match(existingUsername) || username.match(existingEmail)) {
//                 usernameInUse = true;
//             }
//             if (email.match(existingEmail) || email.match(existingUsername)) {
//                 emailInUse = true;
//             }
//
//             return BaseRouter.sendResponse(response, httpStatus.CONFLICT, 'Taken', {
//                 email_in_use: emailInUse,
//                 username_in_use: usernameInUse,
//             });
//         }
//
//         const newUser = new User();
//         newUser.email = email;
//         newUser.passwordHash = bcrypt.hashSync(password);
//         newUser.username = username;
//         await newUser.save();
//
//         logger.info(`New user: ${newUser.username} (${newUser.email})`);
//
//         return BaseRouter.sendResponse(response, httpStatus.CREATED, 'Registered', {
//             email: newUser.email,
//             username: newUser.username,
//             uuid: newUser.uuid,
//         });
//     }
//
//     @BaseRouter.requestDecorator(BaseRouter.checkAdmin)
//     private static async getUsers(_request: Request, response: Response): Promise<Response> {
//         const users: User[] = await User.doQuery()
//             .leftJoinAndSelect('user.characters', 'character')
//             .orderBy('user.id')
//             .getMany();
//         return BaseRouter.sendSuccessResponse(response, users);
//     }
//
//     @BaseRouter.requestDecorator(BaseRouter.checkLogin)
//     private static async getUser(request: Request, response: Response): Promise<Response> {
//         const user: User | undefined = await User.findOne({uuid: request.params.uuid});
//
//         if (!user) {
//             // No user with that username was found
//             return BaseRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
//         }
//
//         return BaseRouter.sendResponse(response, 200, 'Moo', user);
//     }
//
//     @BaseRouter.requestDecorator(BaseRouter.checkAdmin)
//     private static async getUserById(request: Request, response: Response): Promise<Response> {
//         const user: User | undefined = await User.findOne(request.params.id);
//
//         if (!user) {
//             // No user with that username was found
//             return BaseRouter.sendResponse(response, httpStatus.NOT_FOUND, 'UserNotFound');
//         }
//
//         return BaseRouter.sendResponse(response, 200, 'Moo', user);
//     }
//
//     constructor() {
//         super();
//         this.createGetRoute('/', UserRouter.getUsers);
//         this.createGetRoute('/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', UserRouter.getUser);
//         this.createGetRoute('/:id([0-9])', UserRouter.getUserById);
//         this.createPostRoute('/', UserRouter.createUser);
//         this.createAllRoute('*', (_request: Request, response: Response) => BaseRouter.send404(response));
//     }
// }
