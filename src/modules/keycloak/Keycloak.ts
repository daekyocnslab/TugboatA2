// @ts-ignore
import React, {useEffect, useState} from 'react';
import { LoginType} from "../../types/LoginType";


/**
 * 키클락 접속 정보
 */

export class Keycloak {
    private static instance: Keycloak;
    private config: LoginType.KeycloakConfig;

    private constructor(config: LoginType.KeycloakConfig) {
        this.config = config;
    }

    public static getInstance(config: LoginType.KeycloakConfig): Keycloak {
        if (!Keycloak.instance || Keycloak.instance.config != config) {
            Keycloak.instance = new Keycloak(config);
        }
        return Keycloak.instance;
    }


    public getLoginURL(): string {
        const responseType = 'code';
        const authEndPoint = `${this.config.keycloakBaseUrl}/realms/${this.config.realmName}/protocol/openid-connect/auth`;
        const authUrl = `${authEndPoint}?client_id=${this.config.clientId}&redirect_uri=${encodeURIComponent(
            this.config.loginRedirectTo
        )}&response_type=${responseType}&scope=${encodeURIComponent(
            this.config.scopes,
        )}`;
        return authUrl;
    }

    public getLogoutURL(idToken: string): string {
        const authEndPoint = `${this.config.keycloakBaseUrl}/realms/${this.config.realmName}/protocol/openid-connect/logout`;
        const authUrl = `${authEndPoint}?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(
            this.config.logoutRedirectTo,
        )}`;
        return authUrl;
    }

    /**
     * 인증 코드 추출 함수
     * @param url
     */
    public extractCodeFromUrl = (url: string): string | null => {
        const regex = /[?&]code=([^&#]*)/i;
        const match = regex.exec(url as string);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        console.error('url로 부터 인증코드를 추출하는 중에 오류가 발생하였습니다.: ' + url);
        return null;
    };
}






