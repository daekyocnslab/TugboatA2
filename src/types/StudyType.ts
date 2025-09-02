import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStateStatus } from 'react-native';
import { CommonType } from './common/CommonType';
/**
 * 학습 관련 Type을 관리합니다.
 */
export declare module StudyType {
	/**
	 * 학습 실행 시작 DTO
	 * INSERT 시 들어가지 않는 데이터에 대해 optinal을 사용하였음
	 */
	export type StudyDoStartDto = {
		doSq?: number; // 실행 시퀀스
		planSq: number; // 계획 시퀀스
		userSq: number; // 사용자 시퀀스
		doNm: string; // 실행 이름
		strtDt?: string; // 시작 날짜
		strtDttm?: string; // 시작 일자
		strtEmtn: string | null; // 시작 정서
		regTs?: string; // 등록 타임 스탬프
	};

	/**
	 * 학습 실행 상세 DTO
	 * INSERT 시 들어가지 않는 데이터에 대해 optinal을 사용하였음
	 */
	export type StudyDoDtlDto = {
		doDtlSq?: number; // 실행 상세 시퀀스
		doSq: number; // 실행 시퀀스
		regTs?: string; // 등록 타임스탬프
		// msrdTm: string,             // 측정된 시간 - msrdSec 변경으로 미사용
		msrdCnt: number; // 측정된 횟수
		faceDtctYn: boolean; // 얼굴 탐지 여부
		exprCd: string; // 표현 코드
		valence: number; // valence
		arousal: number; // arousal
		emtnCd: string; // 정서코드
		atntn: number; // 집중력
		strss: number; // 스트레스
		strtTs: Date; // 시작 타임스탬프
		endTs: Date; // 종료 타임스탬프
	};

	/**
	 * 학습 실행 종료 DTO
	 * INSERT 시 들어가지 않는 데이터에 대해 optinal을 사용하였음
	 */
	export type StudyDoEndDto = {
		doSq: number; // 실행 시퀀스
		endDt?: string; // 종료 일시
		endDttm?: string | null; // 종료 일자
		stdyTm?: string | null; // 공부 시간
		purestdyTm?: string | null; // 순공 시간
		bststdyTm?: string | null; // 열공 시간
		maxAtntn?: number | null; // 최대 집중력
		avgAtntn?: number | null; // 평균 집중력
		avgStrss?: number | null; // 평균 스트레스
		regTs?: string; // 등록 타임 스탬프
		avgArousal?: number; // 평균 각성도
		avgValence?: number; // 평균 감정가
		msrdCnt?: number; // 측정 횟수
		stdySecs?: number; // 공부 시간(초)
		purestdySecs?: number; // 순공 시간(초)
		bststdySecs?: number; // 열공 시간(초)
	};

	/**
	 * 학습 실행 상세 SQLite용 DTO
	 */
	export type StudyDoDtlSQliteDto = {
		doSq: number; // 실행 시퀀스
		regTs: string; // 등록 타임스탬프
		msrdSecs: number; // 측정 시간
		msrdCnt: number; // 측정된 횟수
		faceDtctYn: number; // 얼굴 탐지 여부
		exprCd: string; // 표현 코드
		valence: number; // valence
		arousal: number; // arousal
		emtnCd: string; // 정서코드
		atntn: number; // 집중력
		strss: number; // 스트레스
		strtTs: string; // 시작 타임스탬프
		endTs: string; // 종료 타임스탬프
		stdySecs?: number; // 공부 시간(초)
		purestdySecs?: number; // 순공 시간(초)
		bststdySecs?: number; // 열공 시간(초)
		studyDoExprDtoList?: StudyType.StudyDoExprDto[];
		studyDoEmtnDtoList?: StudyType.StudyDoEmtnDto[];
		exprCdNum?: number;
		exprCnt?: number;
		msrdEmtn?: string;
		emtnCnt?: number;
	};

	/**
	 * 우리학교는 학생 리스트
	 */
	export type StudyOnlineUserListDto = {
		grpId?: string;
		userNm?: string;
		userNickNm?: string;
		userSq?: number;
		todayStdyTm?: string;
		todayRanking?: number;
		monthStdyTm?: string;
		monthRanking?: number;
		online?: boolean;
	};

	/**
	 * 학습 하단으로 보내는 props
	 */
	export type StudyBottomProps = {
		route: RouteProp<CommonType.RootStackPageList, any>;
		navigation: StackNavigationProp<CommonType.RootStackPageList, any>;
		appState: AppStateStatus;
		planNm: string;
		setIsOpenDetailView: React.Dispatch<React.SetStateAction<boolean>>;
		accTotalMinute: number;
	};

	/**
	 * HSEmotion 수행 결과 반환값
	 */
	export type ResultHsemotion = {
		arousalArr: Float32Array | number[]; // arousal
		valenceArr: Float32Array | number[]; // valence
		emotionCode: string; // 감정코드
	};

	/**
	 * 학습 실행 상세 누적 DTO
	 * 데이터를 누적하여서 실제 평균을 내고 처리하도록 구성합니다.
	 */
	export type StudyDoDtlSum = {
		doDtlSq?: number; // 실행 상세 시퀀스
		doSq: number; // 실행 시퀀스
		regTs?: string; // 등록 타임스탬프
		msrdTmArr: number[]; // 측정된 시간
		msrdCnt?: number; // 측정된 횟수
		isFaceDtctArr: number[]; // 얼굴 탐지 여부 배열
		exprCdArr: string[]; // 표현 코드 배열
		valenceArr: number[]; // valence 배열
		arousalArr: number[]; // arousal 배열
		emtnCdArr: string[]; // 정서코드 배열
		atntnArr: number[]; // 집중력 배열
		strssArr: number[]; // 스트레스 배열
		tensorResultArr: number[]; // FSA Array
	};

	export type ReduxStudyInfo = {
		score: number; // 최고의 집중력 스코어
		tensorImageStr: string; // 최고의 집중력의 텐서 이미지
		nowTime: string; // 최고의 1분이 발생한 시간
		isVisibleAtntn: boolean; // 집중력 점수 보여주기
		isVisibleStress: boolean; // 스트레스 정도 보여주기
		isVisibleBestMinPicture: boolean; // 최고의 1분 사진 보여주
		planSq: number; // 계획 시퀀스
		planType: 'AC' | 'TC' | ''; // 계획 타입
		planNm: string; // 계획 이름
	};

	/**
	 * 최고의 1분 데이터를 적재하기 위한 State의 타입
	 */
	export type StudyBestMinuteAcc = {
		score: number; // 최고의 집중력 스코어
		tensorImageStr: string; // 최고의 집중력의 텐서 이미지
		nowTime: string; // 최고의 1분이 발생한 시간
	};

	/**
	 * 최고의 1분 데이터를 출력하기 위한 State 타입
	 */
	export type StudyBestMinute = {
		score: number; // 최고의 집중력 스코어
		imageUri: string | null; // 최고의 집중력의 텐서 이미지
		nowTime: string;
	};

	/**
	 * 학습 이어하기 정보
	 */
	export type StudyEval = {
		isOpenModal?: boolean; // 학습 이어하기 정보가 존재하면 true
		planSq?: number;
		doSq?: number;
		planNm?: string;
		planType?: string;
		continuing?: '' | 'STOP' | 'CONT'; // STOP: 그만하기 팝업 / CONT: 이어하기, 그만하기
		stdySec?: number;
		endCnt?: number;
		thisEvalStatus?: boolean; // 이번주 이어하기가 있는지 여부
		lastEvalStatus?: boolean; // 이전주 이어하기가 있는지 여부
		thisStartDt?: string; // 이번주 이어하기 시작일
		thisEndDt?: string; // 이번주 이어하기 종료일
		lastStartDt?: string; // 지난주 이어하기 시작일
		lastEndDt: string; // 지난주 이어하기 종료일
	};

	/**
	 * 학습 이어하기 정보
	 */
	export type StudyEvalSimple = {
		isOpenModal?: boolean; // 학습 이어하기 정보가 존재하면 true
		doSq?: number;
		stdySec?: number;
		continuing?: '' | 'STOP' | 'CONT'; // STOP: 그만하기 팝업 / CONT: 이어하기, 그만하기
	};

	/**
	 * 학습 감정 데이터 정보
	 */
	export type StudyDoEmtnDto = {
		doSq: number;
		msrdEmtn: string;
		emtnCnt: number;
	};
	/**
	 * 학습 표현 데이터 정보
	 */
	export type StudyDoExprDto = {
		doSq: number;
		exprCd: number;
		exprCnt: number;
	};

	/**
	 * Stopwatch 컴포넌트에서 사용되는 함수들을 부모에서 사용하기 위한 정형화 인터페이스입니다.
	 */
	export type StopwatchFucHandler = {
		start: () => void;
		stop: () => void;
		pause: () => void;
		reset: () => void;
		restart: () => void;
		getNowSec: () => number;
	};

	/**
	 * 학습 상세에서 공통으로 받는 파라미터
	 */
	export type StudyDetailProps = {
		doSq: number; // 학습 시퀀스
		studyMode: 'PURE' | 'BOOST' | 'TIMER'; // 학습 모드(PURE, BOOST, TIMER)
		navigation: StackNavigationProp<CommonType.RootStackPageList, any>; // 페이지 네비게이션
		stopwatchRef: React.RefObject<StudyType.StopwatchFucHandler>; // 스탑워치 속성
		mySchoolUserList: StudyType.StudyOnlineUserListDto[]; // 나의학교 학생 리스트
		selectOnlineUserList: (isTogggleUsed: boolean, isToggle?: boolean) => Promise<StudyType.StudyOnlineUserListDto[]>; // 학교 학생들 리스트
		onSetOpenDtlTab: (param: boolean) => void; // 탭 변환 함수
		isOpenDetailView: boolean; // 탭이 출력되는지 여부
		onSetIsUsingStudent: (param: boolean) => void; // 현재 공부중인 학생인지 여부
	};

	export type UserSbjtInfo = {
		userSq?: number;
		dpOrd?: number; // 정렬 번호
		sbjtCd?: string; // 과목 코드
		sbjtNm?: string; // 과목 명
		isPlus?: boolean; // + 공부 버튼
	};

	export type StudyPlanInfoType = {
		actvYn: boolean;
		billYm: string | null;
		clsUuid: string | null;
		dailyStdyDate: string | null;
		dayBit: string;
		daybitIdx: number;
		delYn: boolean;
		doSq: number;
		grdUuid: string | null;
		maxScore: number;
		modTs: string | null;
		modUser: number;
		notiYn: boolean;
		orgUuid: string | null;
		planNm: string;
		planSq: number;
		planTm: string;
		planTmText: string | null;
		planType: string;
		sbjtCd: string;
		sbjtNm: string | null;
		searchMon: string | null;
		srvc: string | null;
		ssonUuid: string | null;
		stmpPlanCnt: number;
		studyTimeList: any[] | null;
		totalPlanCnt: number;
		userSq: number;
		userUuid: string | null;
	};
}
