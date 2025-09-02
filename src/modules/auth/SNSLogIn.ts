import {Keycloak} from "../keycloak/Keycloak";
import {LoginType} from "../../types/LoginType";
import {SNSMethod} from "../../common/utils/codes/CommonCode";

/**
 * SNS로그인 인스턴스 생성하는 클래스
 */
export class SNSLogin {
    private static instance: SNSLogin;
    private _snsMethod: string;
    private _keycloak: Keycloak;
    private _keycloakConfig: LoginType.KeycloakConfig;

    private constructor(snsMethod: string) {
        this._snsMethod = snsMethod;
        this._keycloak = Keycloak.getInstance(this.loadClientAttrs(snsMethod));
        this._keycloakConfig = this.loadClientAttrs(snsMethod);
    }

    // 인스턴스
    public static getInstance(snsMethod: string): SNSLogin {
        if (SNSLogin.instance == undefined || snsMethod != SNSLogin.instance._snsMethod) {
            SNSLogin.instance = new SNSLogin(snsMethod);
        }
        return SNSLogin.instance;
    }

    get snsMethod(): string {
        return this._snsMethod;
    }

    set snsMethod(value: string) {
        this._snsMethod = value;
    }

    get keycloak(): Keycloak {
        return this._keycloak;
    }

    set keycloak(value: Keycloak) {
        this._keycloak = value;
    }

    get keycloakConfig(): LoginType.KeycloakConfig {
        return this._keycloakConfig;
    }

    set keycloakConfig(value: LoginType.KeycloakConfig) {
        this._keycloakConfig = value;
    }

    private loadClientAttrs(snsMethod: string): LoginType.KeycloakConfig {
        let commonConfig = {
            keycloakBaseUrl: process.env.KEYCLOAK_SERVER!,
            realmName: process.env.KEYCLOAK_REALMS!,
            loginRedirectTo: process.env.KEYCLOAK_REDIRECT_URI!,
            logoutRedirectTo: process.env.KEYCLOAK_REDIRECT_LOGOUT_URI!,
            scopes: 'openid',
        }
        switch (this._snsMethod) {
            case SNSMethod.KAKAO:       //카카오
                return {
                    ...commonConfig,
                    clientId: process.env.KEYCLAOK_KAKAO_CLIENT_ID!,
                    clientSecret: process.env.KEYCLAOK_KAKAO_CLIENT_SECRET!,
                };
            case SNSMethod.GOOGLE:      //구글
                return {
                    ...commonConfig,
                    clientId: process.env.KEYCLAOK_GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.KEYCLAOK_GOOGLE_CLIENT_SECRET!,
                };
            default:
                return {
                    ...commonConfig,
                    clientId: "",
                    clientSecret: ""
                };
        }
    }
}