import {Keycloak} from "../keycloak/Keycloak";
import {LoginType} from "../../types/LoginType";


/**
 * ID/PW로그인 인스턴스 생성하는 클래스
 */
export class Login {

    private static instance: Login;
    private _keycloak: Keycloak;
    private _keycloakConfig : LoginType.KeycloakConfig = {
        keycloakBaseUrl: process.env.KEYCLOAK_SERVER!,
        realmName: process.env.KEYCLOAK_REALMS!,
        clientId: process.env.KEYCLAOK_APP_CLIENT_ID!,
        clientSecret: process.env.KEYCLAOK_APP_CLIENT_SECRET!,
        loginRedirectTo: process.env.KEYCLOAK_REDIRECT_URI!,
        logoutRedirectTo: process.env.KEYCLOAK_REDIRECT_LOGOUT_URI!,
        scopes: 'openid',
    };

    private constructor() {
        this._keycloak = Keycloak.getInstance(this._keycloakConfig);
    }

    // 인스턴스
    public static getInstance(): Login {
        if (!Login.instance) {
            Login.instance = new Login();
        }
        return Login.instance;
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
}