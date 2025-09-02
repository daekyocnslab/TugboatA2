import { SUCCESS_CODE } from '../../common/utils/codes/CommonCode';
import { RootState } from '../../modules/redux/RootReducer';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import AttendanceService from '../../services/attendance/AttendanceService';
import { StudyPlanType } from '../../types/StudyPlanType';
import { StudyType } from '../../types/StudyType';
import _ from 'lodash';
import { Image } from 'react-native';
import DementionUtils from '../../common/utils/DementionUtils';
import { useNavigation } from '@react-navigation/native';
import TbStdyDoDtlModules from '../../modules/sqlite/TbStdyDoDtlModules';
import StudyService from '../../services/study/StudyService';
import { AxiosResponse } from 'axios';
import { CommonType } from '../../types/common/CommonType';
import { fontRelateSize, heightRelateSize, widthRelateSize } from '../../../../tugboat-mobile/src/common/utils/DementionUtils';

const studyMessages = [
	'하루하루 성장 프로젝트',
	'나의 공부 온도 올리기',
	'꾸준히 하루 한 칸',
	'오늘의 공부 퀘스트',
	'내일이 더 똑똑해지는 계획',
];
const StudyPlanScreen = ({ route, navigation }) => {
	// 학습 계획 리스트에서 전달받은 파라미터
	const {
		doSq: DO_SQ,
		isContinue: IS_CONTINUE, // 이어하기 여부(true/false)
		stdySec: STDY_SEC, // 이어하기 시간
		planNm: PLAN_NM,
	} = route.params!;

	const reduxUserInfo = useSelector((state: RootState) => state.userInfo);
	const authState = useSelector((state: RootState) => state.authInfo);
	const [doSq, setDoSq] = useState<number>(route.params.doSq); // 학습 실행 시퀀스

	const [studySubjectList, setStudySubjectList] = useState<StudyType.UserSbjtInfo[]>([]);
	const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
	const [studySubjectInfo, setStudySubjectInfo] = useState<{ sbjtCd?: string; sbjtNm?: string }>({
		sbjtCd: '',
		sbjtNm: '',
	});

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		// const subjects = await AttendanceService.selectUserSbjtInfo(authState, { userSq: 182 }).then(res => res.data.result);
		const subjects = await AttendanceService.selectUserSbjtInfo(authState, { userSq: reduxUserInfo.userSq }).then(
			(res) => res.data.result,
		);

		// + 공부용 가짜 항목 추가
		const plusStudyItem = {
			sbjtCd: '', // 빈 코드
			sbjtNm: '+ 공부',
			isPlus: true, // 추가 플래그
		};

		setStudySubjectList([...subjects, plusStudyItem]);
	};

	const handleStudySubject = (() => {
		return {
			/**
			 * 학습 계획을 선택합니다.
			 * @param sbjtCd
			 * @param sbjtNm
			 */
			selectedStudySubject: async (sbjtCd: string = '', sbjtNm: string) => {
				console.log('[+] 선택한 학습 계획 ::: ', sbjtNm);

				const STDY_SEC = '00:00:00';
				const DAY_BIT = '0000000';
				const PLAN_TYPE = 'MY';
				const SBJTCD = '9';

				const _studyPlanObj: StudyPlanType.StudyPlanDto = {
					userSq: reduxUserInfo.userSq,
					planNm: sbjtNm,
					planTm: STDY_SEC,
					dayBit: DAY_BIT,
					actvYn: true,
					studyTimeList: [],
					delYn: false,
					notiYn: false,
					planType: "AC",
					sbjtCd: SBJTCD,
					modUser: reduxUserInfo.userSq,
				};
				// [CASE1] 하단의 버튼을 누르지 않고 들어온 경우 : 등록
				console.log('[+] 계획 등록을 수행하는 경우!!!');
				await AttendanceService.readyStudyStrt(authState, _studyPlanObj)
					.then((res) => {
						const { result, resultCode, resultMsg } = res.data;
						if (resultCode === SUCCESS_CODE.INSERT) {
							let { doSq } = result;
							console.log('[+] 계획 등록에 성공하였습니다');
							setStudySubjectInfo({ sbjtCd, sbjtNm });
							setDoSq(doSq);

							navigation.replace('MEDITATION', {
								doSq: doSq,
								isContinue: false,
								stdySec: STDY_SEC,
								planNm: sbjtNm,
							});

							// 학습 페이지로 이동하기
						} else {
							console.log('[+] 학습계획 목록 리스트를 추가하는 중에 오류가 발생하였습니다.', resultCode, result, resultMsg);
						}
					})
					.catch((err) => {
						console.error('[-] 학습계획 목록 리스트를 추가하는 중에 오류가 발생하였습니다.', err);
					});
			},
			stop: async (): Promise<void> => {
				try {
					if (DO_SQ) {
						// [STEP1] [SQlite]내에서 데이터 존재여부를 반환받습니다.
						const stdyDtlCnt = await TbStdyDoDtlModules.selectStdyDtlCnt(doSq!);
						// [CASE2-1] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우 : doSq로만 학습 종료 테이블을 등록합니다.
						if (stdyDtlCnt === 0) {
							console.log('[+] 데이터가 존재하지 않는 경우에 대한 처리 ');
							const selectStdyDoDtlAvg: StudyType.StudyDoDtlSQliteDto = {
								doSq: DO_SQ!,
								regTs: '',
								msrdSecs: 0,
								msrdCnt: 0,
								faceDtctYn: 0,
								exprCd: '',
								valence: 0,
								arousal: 0,
								emtnCd: '',
								atntn: 0,
								strss: 0,
								strtTs: '',
								endTs: '',
								studyDoExprDtoList: [],
								studyDoEmtnDtoList: [],
							};
							await apiHandler.insertStudyDoEnd(selectStdyDoDtlAvg);
						} else {
							/*
							 * [CASE2-2] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우
							 * - 1. SQLITE 내에 DTL 테이블로 평균값을 추출합니다
							 * - 2. SQLITE 내에 DTL 테이블로 감정(EMTN)을 추출합니다
							 * - 3. SQLITE 내에 DTL 테이블로 표현(EXPR)을 추출합니다
							 * - 4. API 서버로 모든 데이터를 전송합니다.
							 * - 5. SQLITE 내에 DTL 테이블 데이터 초기화
							 */
							const { selectStdyDoDtlAvg, selectStudyDoEmtn, selectStudyDoExpr, deleteStudyDoDtl, selectStdyDoDtlList } =
								TbStdyDoDtlModules;
							const selectStdyDoDtlAvgRlt = await selectStdyDoDtlAvg(doSq); // 1. [SQLite] TB_STDY_DO_DTL 평균 조회
							selectStdyDoDtlAvgRlt.doSq = doSq;
							const studyDoEmtnList = await selectStudyDoEmtn(doSq); // 2. [SQLite]TB_STDY_DO_DTL 기반 감정(EMTN) 조회
							const studyDoExprList = await selectStudyDoExpr(doSq); // 3. [SQLite]TB_STDY_DO_DTL 기반 표현(EXPR) 조회
							selectStdyDoDtlAvgRlt.studyDoEmtnDtoList = studyDoEmtnList;
							selectStdyDoDtlAvgRlt.studyDoExprDtoList = studyDoExprList;
							await apiHandler.insertStudyDoEnd(selectStdyDoDtlAvgRlt); // 4. [SQLite]API 서버로 모든 데이터를 전송합니다.
							await deleteStudyDoDtl(doSq); // 5. [SQLite] SQLITE 내에 DTL 테이블 데이터 초기화
						}
						await TbStdyDoDtlModules.selectStdyDoDtlList(doSq); // TODO : 완전 삭제되었는지 한번 체크
						navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
					} else {
						navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
					}
				} catch (error) {
					console.log('[-] 이어하기 중 실패하였습니다. ', error);
				}
			},
		};
	})();

	const apiHandler = (() => {
		return {
			/**
			 * 학습 실행(TB_STUDY_DO_END) 테이블 INSERT
			 * @param {StudyType.StudyDoEndDto} studyDoEnd 학습 실행 종료 정보
			 * @return {Promise<void>} 별도 처리 없음
			 */
			insertStudyDoEnd: async (studyDoEnd: StudyType.StudyDoEndDto): Promise<void> => {
				await StudyService.insertStudyDoEnd(authState, studyDoEnd)
					.then((res: AxiosResponse<StudyType.StudyDoEndDto & CommonType.apiResponseType, any>) => {
						let { result, resultCode } = res.data;
						// 등록에 성공하였을 경우
						if (resultCode === SUCCESS_CODE.INSERT && result === 1) {
							console.log('[+] 등록에 성공하였습니다.');
						} else console.log('[-] 등록에 실패하였습니다. 관리자에게 문의해주세요');
					})
					.catch((err) => {
						console.error(`[-] apiHandler.insertStudyDoEnd() 함수에서 에러가 발생하였습니다`, err);
					});
			},
		};
	})();

	return (
		<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
			<StatusBar backgroundColor="#17191c" />

			<View style={styles.container}>
				<View>
					<View style={styles.profileSection}>
						{/* 프로필 아이콘 */}
						<View style={styles.profileIconWrapper}>
							<Image
								style={styles.profileIcon}
								source={require('../../../assets/images/icons/ic_l_tugbot_44.png')}
								resizeMode="contain"
							/>
						</View>

						{/* 인사말 */}
						<View style={styles.greetingRow}>
							<Text style={styles.greetingText}>반가워요! </Text>
							<Text style={styles.userName}>
								{reduxUserInfo.loginId.slice(reduxUserInfo.groups['grpId'].length)}{' '}
								{reduxUserInfo.userNm}
							</Text>
							<Text style={styles.greetingText}> 님</Text>
						</View>
					</View>

					<View style={styles.gridContainer}>
						{_.chunk(studySubjectList, 2).map((row, rowIndex) => (
							<View key={rowIndex} style={styles.row}>
								{row.map((item, index) => (
									item.isPlus ? (
										<TouchableOpacity
											key={`plus-${index}`}
											style={styles.plusButton}
											onPress={() => {
												const msg = studyMessages[Math.floor(Math.random() * studyMessages.length)];
												setSelectedSubjectId('');
												handleStudySubject.selectedStudySubject('', msg);
											}}
										>
											<Text style={styles.plusText}>{item.sbjtNm}</Text>
										</TouchableOpacity>
									) : (
										<TouchableOpacity
											key={index}
											style={styles.subjectButton}
											onPress={() => {
												setSelectedSubjectId(item.sbjtCd!);
												handleStudySubject.selectedStudySubject(item.sbjtCd, item.sbjtNm!);
											}}
										>
											<Text style={styles.subjectText}>{item.sbjtNm}</Text>
										</TouchableOpacity>
									)
								))}

								{/* ✅ 홀수일 때 빈칸 하나 추가해서 정렬 맞춤 */}
								{row.length === 1 && <View style={{ flex: 1 }} />}
							</View>
						))}
					</View>

				</View>

				<View style={styles.logoutContainer}>
					<TouchableOpacity style={styles.logoutButton} onPress={handleStudySubject.stop}>
						<Text style={styles.logoutButtonText}>다시 로그인 하기</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
};
export default StudyPlanScreen;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#2e3138',
		padding: widthRelateSize(24),
	},
	container: {
		flex: 1,
		justifyContent: 'space-between',
	},
	profileSection: {
		alignItems: 'center',
		marginBottom: heightRelateSize(28),
	},
	profileIconWrapper: {
		width: widthRelateSize(60),
		height: widthRelateSize(60),
		borderStyle: 'solid',
		borderWidth: 1,
		borderRadius: widthRelateSize(30),
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: heightRelateSize(16),
		backgroundColor: '#3F4855',
		borderColor: '#2E3138',
	},
	profileIcon: {
		width: widthRelateSize(40),
		height: widthRelateSize(40),
	},
	greetingRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	greetingText: {
		fontSize: fontRelateSize(18),
		fontFamily: 'NanumBarunGothic',
		color: '#f0f1f2',
		textAlign: 'center',
	},
	userName: {
		fontSize: fontRelateSize(20),
		fontWeight: '800',
		color: '#f0f1f2',
		textAlign: 'center',
		marginBottom: heightRelateSize(4),
	},

	gridContainer: {
		gap: widthRelateSize(15),
		paddingHorizontal: widthRelateSize(20),
		paddingVertical: heightRelateSize(28),
		marginBottom: heightRelateSize(20),
	},
	row: {
		flexDirection: 'row',
		gap: widthRelateSize(12),
		justifyContent: 'space-between', // 좌우 균등 분배
	},
	rowCentered: {
		justifyContent: 'center',
	},
	rowSingleLeft: {
		justifyContent: 'flex-start',
	},
	plusButton: {
		flex: 1,
		height: heightRelateSize(45),
		borderRadius: widthRelateSize(6),
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: '#4A90E2',
	},
	plusText: {
		fontSize: fontRelateSize(15),
		fontWeight: '600',
		color: '#4A90E2',
	},
	subjectButton: {
		flex: 1, // 버튼이 가로 공간을 균등 분배
		height: heightRelateSize(45),
		borderRadius: widthRelateSize(6),
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#212429',
	},
	subjectText: {
		fontSize: fontRelateSize(15),
		fontWeight: '600',
		color: '#aab0be',
	},

	logoutContainer: {
		alignItems: 'center',
	},
	logoutButton: {
		borderRadius: widthRelateSize(6),
		backgroundColor: '#6491ff',
		width: widthRelateSize(150),
		height: heightRelateSize(40),
		overflow: 'hidden',
		paddingHorizontal: widthRelateSize(10),
		paddingVertical: heightRelateSize(6),
		alignContent: 'center',
		justifyContent: 'center',
	},
	logoutButtonText: {
		fontSize: fontRelateSize(15),
		fontWeight: '700',
		color: '#fff',
		textAlign: 'center',
		justifyContent: "center",
		alignContent: "center"
	},
});