export declare module StampPblsType {

    export type StampPblsDto = {
        stampSq?: number;            // 스템프 시퀀스
        userSq: number;             // 사용자 시퀀스
        planSq: number;             // 계획 시퀀스
        pblsDttm?: string;           //
        pblsRsn: string;            //
    }

    export type MyStampPblsReqDto = {
        userSq: number;             // 사용자 시퀀스
        searchMon?: string; // 조회월 : 202310
    }

    export type MyStampPblsResDto = {
        stampSq?: number;            // 스템프 시퀀스
        userSq: number;             // 사용자 시퀀스
        planSq?: number;             // 계획 시퀀스
        pblsDttm?: string;           //
        pblsRsn?: string;            //
        searchMon?: string; // 조회월 : 202310
        planNm?: string;    // 계획 이름
        planTm?: string;     // 계획 시간
        planTmText?: string;   // 계획시간 텍스트 (오전/오후 12시간표기)
        dayBit?: string; // 요일 비트
        dayBitText?: string; // 요일 비트
        actvYn?: boolean; // 활성화 여부
        planType?: string   // 계획 타입
        notiYn?: boolean; // 알람 여부
        delYn?: boolean; // 삭제 여부
        stdyTm?: number; // 누적시간
        stdyTmText?: number; // 누적시간 텍스트
        pblsDt?: string; // 발급 날짜

    }
    export type ToolTipDto = {
        planNm?: string;    // 계획 이름
        pblsDt?: string; // 발급 날짜
    }

    export type MyCardResDto= {
        totalPlanCnt?: number; // 조회월 : 202310
        stampPlanCnt?: number; // 조회월 : 202310
        totalStdyTmSum?: string ; // 총 누적시간
        stampPblsDtos?:MyStampPblsResDto[];
    }
}
