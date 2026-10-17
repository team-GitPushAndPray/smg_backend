import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service.js";
import { UsuarioAuthEntity } from "../entities/index.js";


export interface JwtPayload {
    sub: number;
    email: string;    
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        private readonly authService: AuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'fallback_secret_dev'
        });
    }

    async validate(payload: JwtPayload): Promise <UsuarioAuthEntity> {
        return this.authService.validateUserById(payload.sub);
    }
}