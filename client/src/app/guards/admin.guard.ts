import { Injectable } from '@angular/core';

import { UserService } from '../models/user/user.service';
import { BaseGuard } from './base.guard';

@Injectable()
export class AdminGuard extends BaseGuard {

    public condition() {
        return UserService.user.isAdmin;
    }
}
