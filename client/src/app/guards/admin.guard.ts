import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { UserService } from '../models/user/user.service';
import { BaseGuard } from './base.guard';

@Injectable()
export class AdminGuard extends BaseGuard {

    public condition() {
        return !environment.production || (UserService.user && UserService.user.isAdmin);
    }
}
