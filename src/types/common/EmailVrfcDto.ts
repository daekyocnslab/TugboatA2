export declare module EmailType {

    export interface EmailVrfcDto {
        emailVrfcUuid: string; //이메일 확인 uuid
        emailVrfcType: string; //이메일 확인 유형
        rcptNm: string; //수신인 이름
        rcptEmail: string; //수신인 이메일
        emailVrfcCd: string;//이메일 확인 코드
        regTs: string; //등록 타임스탬프
        isVrfcEmail: string;// 검증된 이메일 여부 - 검증됨(1) / 검증되지 않음(0)
    }

    export interface SendDto{
        emailVrfcUuid: string; //이메일 확인 uuid
        emailVrfcType: string; //이메일 확인 유형
        rcptNm: string; //수신인 이름
        rcptEmail: string; //수신인 이메일
    }

    export interface VrfcDto{
        emailVrfcUuid: string; //이메일 확인 uuid
        emailVrfcCd?: string;//이메일 확인 코드
        emailVrfcType: string; //이메일 확인 유형
    }
}