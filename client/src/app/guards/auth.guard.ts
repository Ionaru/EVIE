import { Injectable } from '@angular/core';

import { UserService } from '../models/user/user.service';
import { BaseGuard } from './base.guard';

@Injectable()
export class AuthGuard extends BaseGuard {

    public condition() {
        return !!UserService.user;
    }
}
