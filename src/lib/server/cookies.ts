import jwt from 'jsonwebtoken';

/**
 * @author patrick115 Patrik Mintěl
 * @license MIT
 * @version 1.0.0
 * @description Cookie manager
 */

export class JWTCookies {
    private key: string;
    constructor(key: string) {
        this.key = key;
    }

    setCookie(value: object | string | Buffer) {
        return jwt.sign(value, this.key);
    }

    getCookie<T>(token: string): T | null {
        try {
            return jwt.verify(token, this.key) as T;
        } catch (e) {
            console.error(e);
            return null;
        }
    }
}
