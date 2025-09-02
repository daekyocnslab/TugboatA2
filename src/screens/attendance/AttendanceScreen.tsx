import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
	View,
	Text,
	Image,
	Alert,
	TextInput,
	Pressable,
	TouchableHighlight,
} from 'react-native';
import { RootState } from '../../modules/redux/RootReducer';
import { useDispatch, useSelector } from 'react-redux';
import { SUCCESS_CODE } from '../../common/utils/codes/CommonCode';
import { AxiosResponse } from 'axios';
import DeviceInfoUtil from '../../common/utils/DeviceInfoUtil';
import { LoginType } from '../../types/LoginType';
import { CommonType } from '../../types/common/CommonType';
import styles from './styles/AttendanceScreenStyle';
import TbStdyDoDtlModules from '../../modules/sqlite/TbStdyDoDtlModules';
import { StudyType } from '../../types/StudyType';
import AttendanceService from '../../services/attendance/AttendanceService';
import StudyService from '../../services/study/StudyService';
import { UserType } from '../../types/UserType';
import { setUserData } from '../../modules/redux/slice/UserSlice';
import { GroupType } from '../../types/GroupType';
import NetInfo, { fetch, NetInfoSubscription, useNetInfo } from '@react-native-community/netinfo';
import StudyPlanService from '@/services/study/StudyPlanService';
import { fontRelateSize, heightRelateSize, widthRelateSize } from '../../../../tugboat-mobile/src/common/utils/DementionUtils';

const AttendanceScreen = ({ navigation }) => {
	const { isConnected } = useNetInfo();

	const [input, setInput] = useState('');

	// =================================================================== 전역 속성 관리 ===================================================================
	const dispatch = useDispatch();
	const userState = useSelector((state: RootState) => state.userInfo); // Redux 저장소에서 데이터를 조회해옵니다.
	const authState = useSelector((state: RootState) => state.authInfo); // Redux 저장소에서 데이터를 조회해옵니다.

	const [userInfo, setUserInfo] = useState<UserType.UserSimple>({
		userSq: 0,
		userUuid: '',
		loginUserId: '',
		userNm: '',
	});

	const [group, setGroup] = useState<GroupType.GroupUserMapInfo>(userState.groups);

	const STDY_SEC = '00:00:00';

	const inConnectNetworkRef = useRef<boolean>(true); // 네트워크의 연결 여부를 체크합니다.

	/**
	 *  시작하자마자 실행합니다.
	 */

	useEffect(() => {
		const init = async () => {
			DeviceInfoUtil.hardwareBackRemove(navigation, true); // 안드로이드 뒤로가기 버튼에 대해 방지합니다.
			commonHandler.networkChangeCheckListener(); //네트워크 연결에 상태를 감지하는 리스너를 등록합니다
		};
		init();
	}, []);

	/**
	 * 핸들러 - 번호입력
	 * @param number
	 */
	const handleNumberPress = (number) => {
		if (input.length < 5) {
			setInput((prev) => prev + number);
		}
	};

	/**
	 * 핸들러 - 번호 초기화
	 */
	const handleClear = () => {
		setInput('');
	};

	/**
	 * 핸들러 - 제출
	 */
	const handleSubmit = async () => {
		// 네트워크 연결 상태를 최종적으로 한 번 더 확인
		if (isConnected === false) {
			commonHandler.disconnectNetworkAlert(); // 네트워크 연결이 끊겼을 때 팝업 출력
			return; // 화면 전환 중단
		}

		if (input.length > 0) {
			//출결번호로 회원 조회 요청
			await apiHandler.getUserLoginInfo();
		} else {
			Alert.alert('알림', '출결번호를 입력하세요.', [
				{
					text: '확인',
					onPress: () => { },
				},
			]);
		}
	};

	/**
	 * 핸들러 - 회원확인
	 */
	const handleConfirm = (userLoginId) => {
		// 로그인 요청
		if (userLoginId) apiHandler.requestAttendance(userLoginId);
	};

	const handleCancle = () => {
		//사용자 정보 초기화
		setUserInfo({
			userSq: 0,
			userUuid: '',
			loginUserId: '',
			userNm: '',
		});
	};

	/**
	 * 일반적인 핸들러
	 */
	const commonHandler = (() => {
		return {
			/**
			 * 네트워크 변화에 대해 체크하는 리스너
			 * @returns
			 */
			networkChangeCheckListener: (): NetInfoSubscription => {
				console.log('[+] 연결 상태 확인');
				return NetInfo.addEventListener((state) => {
					inConnectNetworkRef.current = state.isConnected!; // 연결 상태를 변수로 저장합니다.
					// 네트워크 연결이 끊겼을때, 학습을 중단시키고 팝업을 출력합니다.
					if (!inConnectNetworkRef.current) {
						commonHandler.disconnectNetworkAlert();
					}
				});
			},

			/**
			 * 네트워크 연결이 끊겼을때, 메시지를 출력합니다.
			 * @returns
			 */
			disconnectNetworkAlert: (): void => {
				console.log('네트워크 연결이 끊겼습니다.');

				Alert.alert('알림', '네트워크 연결을 확인해주세요.', [
					{
						text: '확인',
						onPress: () => { },
					},
				]);
				return;
			},
		};
	})();

	/**
	 * 학습 이어하기 관련 Handler
	 */
	const continueHandler = ((continueDoSq) => {
		return {
			/**
			 * 그만하기 버튼 처리 => 종료테이블 추가후 종료
			 * @returns {Promise<void>}
			 */
			stop: async (continueDoSq): Promise<void> => {
				try {
					handleClear();
					if (continueDoSq) {
						// [STEP1] [SQlite]내에서 데이터 존재여부를 반환받습니다.
						const stdyDtlCnt = await TbStdyDoDtlModules.selectStdyDtlCnt(continueDoSq!);
						// [CASE2-1] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우 : doSq로만 학습 종료 테이블을 등록합니다.
						if (stdyDtlCnt === 0) {
							console.log('[+] 데이터가 존재하지 않는 경우에 대한 처리 ');
							const selectStdyDoDtlAvg: StudyType.StudyDoDtlSQliteDto = {
								doSq: continueDoSq!,
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
							const selectStdyDoDtlAvgRlt = await selectStdyDoDtlAvg(continueDoSq); // 1. [SQLite] TB_STDY_DO_DTL 평균 조회
							selectStdyDoDtlAvgRlt.doSq = continueDoSq;
							const studyDoEmtnList = await selectStudyDoEmtn(continueDoSq); // 2. [SQLite]TB_STDY_DO_DTL 기반 감정(EMTN) 조회
							const studyDoExprList = await selectStudyDoExpr(continueDoSq); // 3. [SQLite]TB_STDY_DO_DTL 기반 표현(EXPR) 조회
							selectStdyDoDtlAvgRlt.studyDoEmtnDtoList = studyDoEmtnList;
							selectStdyDoDtlAvgRlt.studyDoExprDtoList = studyDoExprList;
							await apiHandler.insertStudyDoEnd(selectStdyDoDtlAvgRlt); // 4. [SQLite]API 서버로 모든 데이터를 전송합니다.

							const dtlList = await TbStdyDoDtlModules.selectStdyDoDtlListAll(continueDoSq); // 완전 삭제가 되었는지 보자.
							await apiHandler.studyDoDtlList(dtlList);

							await deleteStudyDoDtl(continueDoSq); // 5. [SQLite] SQLITE 내에 DTL 테이블 데이터 초기화
						}
						TbStdyDoDtlModules.selectStdyDoDtlList(continueDoSq); // TODO : 완전 삭제되었는지 한번 체크
					}
				} catch (error) {
					console.log('[-] 이어하기 중 실패하였습니다. ', error);
					Alert.alert('알림', '이어하기 중 오류가 발생했습니다.', [
						{
							text: '확인',
							onPress: () => { },
						},
					]);
				}
			},
		};
	})();

	const apiHandler = (() => {
		return {
			studyPlanNmByDoSq: async (doSq: number) => {
				// console.log('doSq ::: ', doSq);

				const planNmInfo: StudyType.StudyPlanInfoType = {
					actvYn: false,
					billYm: null,
					clsUuid: null,
					dailyStdyDate: null,
					dayBit: '',
					daybitIdx: 0,
					delYn: false,
					doSq: 0,
					grdUuid: null,
					maxScore: 0,
					modTs: null,
					modUser: 0,
					notiYn: false,
					orgUuid: null,
					planNm: '',
					planSq: 0,
					planTm: '',
					planTmText: null,
					planType: '',
					sbjtCd: '',
					sbjtNm: null,
					searchMon: null,
					srvc: null,
					ssonUuid: null,
					stmpPlanCnt: 0,
					studyTimeList: null,
					totalPlanCnt: 0,
					userSq: 0,
					userUuid: null,
				};
				await StudyPlanService.studyPlanNmByDoSq(authState, { doSq: doSq })
					.then((res) => {
						let { result, resultCode, resultMsg } = res.data;

						if (resultCode === 200) {
							// console.log(result);
							planNmInfo.planNm = result.planNm;
							planNmInfo.doSq = result.doSq;
							planNmInfo.modUser = result.modUser;
							planNmInfo.sbjtCd = result.sbjtCd;
						}
					})
					.catch((error) => {
						console.error(`[-] studyPlanNmByDoSq() 함수에서 에러가 발생하였습니다 : ${error}`);
						Alert.alert('알림', '출결 중 오류가 발생했습니다.', [
							{
								text: '확인',
								onPress: () => { },
							},
						]);
					});
				return planNmInfo;
			},

			/**
			 * 사용자 정보 조회합니다.
			 */
			getUserLoginInfo: async () => {
				let userLoginId = group['grpId'] + input;

				let requestAuthId: { loginId: string } = {
					loginId: userLoginId,
				};

				await AttendanceService.getUserLoginInfo(authState, requestAuthId)
					.then((res: AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any>) => {
						let { result, resultCode, resultMsg } = res.data;

						if (resultCode == SUCCESS_CODE.SELECT) {
							if (result) {
								//회원 확인 알림 출력
								setUserInfo({
									...userInfo,
									userSq: result['userSq'],
									userUuid: result['userUuid'],
									userNm: result['userNm'],
									loginUserId: userLoginId,
								});

								handleConfirm(userLoginId);


							} else {
								Alert.alert('알림', '올바른 출결번호를 입력해주세요.', [
									{
										text: '확인',
										onPress: () => { },
									},
								]);

								console.log('[-] 회원 정보를 찾을 수 없습니다.');
							}
						}
					})
					.catch((err) => {
						console.error(`[-] getUserLoginInfo() 함수에서 에러가 발생하였습니다 : ${err}`);
						Alert.alert('알림', '출결 중 오류가 발생했습니다.', [
							{
								text: '확인',
								onPress: () => { },
							},
						]);
					});
			},

			/**
			 * 출석 및 로그인을 요청합니다.
			 * @return {Promise<void>}
			 */
			requestAttendance: async (loginId: string): Promise<void> => {
				const requestLoginHis: LoginType.AttendanceDto = {
					userSq: userInfo['userSq'],
					userNm: userInfo['userNm'],
					loginId: loginId,
					userIp: await DeviceInfoUtil.getDeviceIpAddr(),
				};
				await AttendanceService.requestAttendanceIn(authState, requestLoginHis)
					.then(async (res: AxiosResponse<LoginType.LoginHistDto & CommonType.apiResponseType, any>) => {
						let { result, resultCode, resultMsg } = res.data;

						if (resultCode == SUCCESS_CODE.SELECT) {
							if (result) {
								let { userSq, userNm, userUuid, continueDoSq } = result;

								//회원 정보 저장
								dispatch(
									setUserData({
										userSq: userSq,
										userUuid: userUuid,
										userNm: userNm,
										loginId: loginId,
									}),
								);

								//continueDoSq 가 있는 경우,
								if (continueDoSq > 0) {
									// 이어하기 없음 - 무조건 종료
									await continueHandler.stop(continueDoSq);

									await navigation.replace('STUDY_PLAN', {
										doSq: 0,
										isContinue: false,
										stdySec: STDY_SEC,
									});
								} else {
									navigation.replace('STUDY_PLAN', {
										doSq: 0,
										isContinue: false,
										stdySec: STDY_SEC,
									});
								}
							} else {
								Alert.alert('알림', '로그인 중에 오류가 발생하였습니다.', [
									{
										text: '확인',
										onPress: () => { },
									},
								]);

								console.log('[+] 로그인 중에 오류가 발생하였습니다.', resultCode, result, resultMsg);
							}
						} else {
							Alert.alert('알림', `${resultMsg}`, [
								{
									text: '확인',
									onPress: () => { },
								},
							]);
						}
					})
					.catch((err) => {
						console.error(`[-] requestAttendance() 함수에서 에러가 발생하였습니다 : ${err}`);
						Alert.alert('알림', '출결 중 오류가 발생했습니다.', [
							{
								text: '확인',
								onPress: () => { },
							},
						]);
					});
			},

			// 학습상세 저장
			studyDoDtlList: async (dtlList: StudyType.StudyDoDtlSQliteDto[]) => {
				try {
					await StudyService.studyDoDtlList(authState, dtlList)
						.then((res) => {
							const { result, resultCode, resultMsg } = res.data;

							if (resultCode === SUCCESS_CODE.INSERT) {
								console.log('[+] DTL 리스트 전송 성공', result);
							} else {
								console.log('[-] DTL 리스트 전송 실패', resultCode, resultMsg);
							}
						})
						.catch((err) => {
							console.error('[-] DTL 리스트 전송 중 오류:', err);
							Alert.alert('알림', '데이터 전송 중 오류가 발생했습니다.');
						});
				} catch (err) {
					console.error(`[-] studyDoDtlList() 함수에서 에러가 발생하였습니다 : ${err}`);
				}
			},

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

						Alert.alert('알림', '학습 종료 중 오류가 발생했습니다.', [
							{
								text: '확인',
								onPress: () => { },
							},
						]);
					});
			},
		};
	})();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>출결번호 입력 후, OK !</Text>
			<TextInput
				style={styles.attendanceInput}
				value={input}
				// placeholder='출결번호를 입력하세요'
				keyboardType='default'
				autoCapitalize='none'
				editable={false}
				autoFocus={false}  // ✅ 자동 포커스 방지
				selectTextOnFocus={false}
				showSoftInputOnFocus={false}
				maxLength={5}
			/>

			<View style={styles.keyContainer}>
				{['1', '2', '3', '4', '5', '6', '7', '8', '9', '지우기', '0', '입장'].map((key, index) => (
					<TouchableHighlight
						// activeOpacity={0.2}
						underlayColor='#2E3138'
						key={index}
						style={[styles.key]}
						onPress={() => {
							if (key === '지우기') {
								handleClear();
							} else if (key === '입장') {
								handleSubmit();
							} else {
								handleNumberPress(key);
							}
						}}>
						{key === '지우기' ? (
							<Image
								source={require('../../../assets/images/icons/Removeicon.png')}
								style={styles.keyImage}
								resizeMode='contain'
							/>
						) : (
							<Text style={[styles.keyText]}>{key === '입장' ? 'OK' : key}</Text>
						)}
					</TouchableHighlight>
				))}
			</View>

			<Pressable style={styles.changeLogin} onPress={() => navigation.goBack()}>
				<Text
					style={{
						color: '#6491FF',
						fontSize: fontRelateSize(14),
						fontFamily: 'bold',
					}}>
					로그인 방법 변경
				</Text>
			</Pressable>
		</View>
	);
};

export default AttendanceScreen;
