import {Keycloak} from "../keycloak/Keycloak";
import {LoginType} from "../../types/LoginType";


/**
 * 키클락 서비스 계정 로그인 인스턴스 생성하는 클래스
 */
export class AdminCliLogin {
    private static _instance: AdminCliLogin;
    private _keycloak: Keycloak;

    private _keycloakConfig : LoginType.KeycloakConfig = {
        keycloakBaseUrl: process.env.KEYCLOAK_SERVER!,
        realmName: process.env.KEYCLOAK_REALMS!,
        clientId: process.env.KEYCLAOK_ADMIN_CLI!,
        clientSecret: process.env.KEYCLAOK_ADMIN_CLI_SECRET!,
        loginRedirectTo: process.env.KEYCLOAK_REDIRECT_URI!,
        logoutRedirectTo: process.env.KEYCLOAK_REDIRECT_LOGOUT_URI!,
        scopes: 'openid',
    };

    private constructor() {
        this._keycloak = Keycloak.getInstance(this._keycloakConfig);
    }

    // 인스턴스
    public static getInstance(): AdminCliLogin {
        if (!AdminCliLogin._instance) {
            AdminCliLogin._instance = new AdminCliLogin();
        }
        return AdminCliLogin._instance;
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