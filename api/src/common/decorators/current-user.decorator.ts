import { createParamDecorator } from "@nestjs/common";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    joinedAt: Date;
};

export const CurrentUser = createParamDecorator((_, ctx)=>{
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser;
});
