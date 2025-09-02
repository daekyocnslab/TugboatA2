/**
 * 학습 계획 관련 Type을 관리합니다.
 */
export declare module StudyPlanType {
	/**
	 * 학습 계획 DTO
	 */
	export type StudyPlanDto = {
		userSq: number; // 사용사 시퀀스
		planNm?: string; // [Optional] 계획 이름
		planTm?: string; // [Optional] 계획 시간
		dayBit?: string; // [Optional] 요일 비트
		planType?: string; // [Optional] 계획 종류
		planSq?: number; // [Optional] 계획 시퀀스
		actvYn?: boolean; // [Optional] 활성화 여부
		delYn?: boolean; // [Optional] 삭제 여부
		notiYn?: boolean; // [Optional] 알람 여부
		modTs?: string; // [Optional] 변경 타임스탬프
		modUser?: number; // [Optional] 변경 사용자
		maxScore?: number; // [Optional] 평가 최대 점수
		sbjtCd?: string; // [Optional] 학습 과목 코드
		sbjtNm?: string; // [Optional] 학습 과목 코드명
		dailyStdyDate?: string; // 날짜
		studyTimeList?: Array<StudyTimeListDto>; // 공부 시간 목록
		planTmText?: string;
		daybitIdx?: number;
	};

	export type StudyTimeListDto = {
		// 계획 시퀀스
		planSq: number;

		// 사용자 시퀀스
		userSq: number;

		// 계획 이름
		planNm: string;

		// 시작 일자
		strtDttm: Date;

		// 종료 일자
		endDttm: Date;

		// 공부 시간
		stdyTm: Date;
	};

	export type ExistStudyPlanStampParam = {
		planSq: number;
	};

	export type UpdateStudyInfoParam = {
		doSq: number;
		doNm: string;
		modUser: number;
	};
}
