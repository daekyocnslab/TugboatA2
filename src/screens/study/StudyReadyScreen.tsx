// react
import React, { lazy, memo, Suspense, useEffect, useRef, useState } from 'react';
import {
	Image,
	Linking,
	Modal,
	Platform,
	Pressable,
	SafeAreaView,
	ScrollView,
	StatusBar,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
import * as FaceDetector from 'expo-face-detector';

// Libaray
import { Camera, CameraType, FaceDetectionResult } from 'expo-camera';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';

// Screen & Utils
import styles from './styles/StudyReadyScreenStyle';
import { CommonType } from '../../types/common/CommonType';
import DeviceInfoUtil from '../../common/utils/DeviceInfoUtil';
import PermissionUtil from '../../common/utils/PermissionUtil';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import DeviceInfo from 'react-native-device-info';
import { CODE_GRP_CD, SUCCESS_CODE } from '../../common/utils/codes/CommonCode';
import { CodeType } from '../../types/CodeType';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../modules/redux/RootReducer';
import LoginService from '../../services/login/LoginService';
import AttendanceService from '../../services/attendance/AttendanceService';
import { AxiosResponse } from 'axios';
import { UserType } from '../../types/UserType';
import { LoginType } from '../../types/LoginType';
import { setUserData } from '../../modules/redux/slice/UserSlice';

const ToastScreen = lazy(() => import('../../screens/common/ToastScreen'));

/**1
 * [STU_DEF_01_01] 공부모드 ON > 카메라 설정 페이지
 */
const StudyReadyScreen = ({ route, navigation }) => {
	// const { doSq: DO_SQ, isContinue: IS_CONTINUE, stdySec: STDY_SEC } = route.params!   // 학습 계획 리스트에서 전달받은 파라미터

	const dispatch = useDispatch();
	const cameraRef = useRef<Camera>(null); // 카메라 속성 관리
	const timerRef = useRef<NodeJS.Timeout | null>(null); // 타이머 속성 관리
	// const authManager = AuthenticationManager.getInstance(navigation, dispatch);        // 인증 관련 기능 제공하는 매니저 클래스

	const userState = useSelector((state: RootState) => state.userInfo); // Redux 저장소에서 데이터를 조회해옵니다.
	const authState = useSelector((state: RootState) => state.authInfo); // Redux 저장소에서 데이터를 조회해옵니다.

	const [isCameraOn, setIsCameraOn] = useState(true); // 카메라의 온오프 여부
	const [countDown, setCountDown] = useState<number | null>(null);
	const [isCounting, setIsCounting] = useState(false);
	const [isRecognizing, setIsRecognizing] = useState(false);
	const [isRegistering, setRegistering] = useState(false);
	const [isFaceRegisterModalVisible, setIsFaceRegisterModalVisible] = useState(false);
	const [registerUserName, setRegisterUserName] = useState('');
	// ====================================== 권한 모달 팝업 관리 ==============================
	const [permisChecked, setPermisChecked] = useState(false); // 권한 허용여부
	const [isPermisModalOpen, setIsPermisModalOpen] = useState(false); // 권한 모달
	const [isShowToast, setIsShowToast] = useState<boolean>(false); // ToastMessage 출력 여부

	const [userInfo, setUserInfo] = useState<UserType.UserSimple>({
		userSq: 0,
		userUuid: '',
		loginUserId: '',
		userNm: '',
	});

	/**
	 * 화면이 렌더링 된 이후에 수행이 됩니다.
	 */
	useEffect(() => {
		// [STEP1] 앱 꺼짐 방지
		activateKeepAwakeAsync();

		hasCaptured.current = false;

		// [STEP2] 앱 뒤로가기 방지
		// DeviceInfoUtil.hardwareBackRemove(navigation, true);        // 앱 뒤로가기 방지

		console.log('그룹', userState.groups['grpSq']);
		console.log('그룹', userState.groups['grpNm']);

		// [STEP3] 해당 페이지에 최초 들어왔을 경우 '권한체크'를 수행합니다.
		permissionChkHandler.checkPermission().then((res) => res && setIsCameraOn(true));

	}, []);

	/**
	 * 디바이스 권한을 관리하는 Handler 입니다.
	 */
	const permissionChkHandler = (() => {
		const _cameraAndroidPermis = PERMISSIONS.ANDROID.CAMERA;
		const _cameraIOSPermis = PERMISSIONS.IOS.CAMERA;
		return {
			/**
			 * 최초 앱 접근 시 디바이스의 접근 권한을 체크합니다.
			 */
			checkPermission: async (): Promise<boolean> => {
				let hasPermission = true;
				if (Platform.OS === 'android') {
					// 디바이스의 권한이 체크되지 않았을 경우 배열을 갖습니다.
					const notGradtedArr = await PermissionUtil.cmmPermsArrCheck([_cameraAndroidPermis]);
					if (notGradtedArr.length > 0) {
						setIsPermisModalOpen(true);
						hasPermission = false;
					}
				} else if (Platform.OS === 'ios') {
					// 1. 카메라 권한을 확인합니다.
					const permisCameraArr = await PermissionUtil.cmmPermsArrCheck([_cameraIOSPermis]);
					if (permisCameraArr.length > 0) {
						setIsPermisModalOpen(false);
						hasPermission = false;
					}
				}
				return hasPermission;
			},

			/**
			 * 권한 팝업에서 '취소' 버튼을 눌렀을때 경고 Toast Message를 출력합니다.
			 */
			cancleBtn: () => {
				setIsShowToast(true);
			},

			/**
			 * 권한 팝업에서 '확인' 버튼을 눌렀을때 처리를 수행합니다.
			 */
			confirmBtn: () => {
				// [CASE1] 권한 허용을 하지 않았을 경우 : Toast Message를 다시 띄어줍니다.
				if (!permisChecked) setIsShowToast(true);
				else {
					setIsPermisModalOpen(false);
					setIsCameraOn(true);
				}
			},
			/**
			 * 권한 허용에 대한 스위치를 관리합니다
			 * true로 바꿨을 경우 요청 팝업을 띄웁니다.
			 * false로 바꿨을때 처리 없음.
			 */
			toggleSwitch: async () => {
				// [CASE1] Switch를 true로 변경한 경우 : 실제 시스템 권한 팝업을 띄어줍니다.
				if (!permisChecked) {
					await requestMultiple([_cameraAndroidPermis])
						.then((resPremissInfo) => {
							const resultStatus = resPremissInfo['android.permission.CAMERA'];

							// [CASE2-1] 시스템의 권한에서 허용을 누른 경우 : 토글을 변경시켜줌.
							if (resultStatus === 'granted') setPermisChecked(true);
							else {
								Linking.openSettings(); // 핸드폰 상 설정 페이지
							}
						})
						.catch(() => {
							console.log('권한 요청에 실패하였습니다.');
						});
				}
				// [CASE2] Switch를 false로 변경한 경우 : 아무 행동도 하지 않음.
				else {
					setPermisChecked(!permisChecked);
				}
			},
		};
	})();

	// Add a ref to ensure photo is only taken once per session
	const hasCaptured = useRef(false);

	/**
	 * expo-camera 기능을 기반으로 얼굴을 탐지합니다.
	 * @param faceResult
	 */
	const handleFacesDetected = async (faceResult: FaceDetectionResult) => {
	  if (!faceResult || !Array.isArray(faceResult.faces)) {
	    console.warn('얼굴 인식 결과가 비정상적입니다:', faceResult);
	    return;
	  }

	  const { faces } = faceResult;
	  if (faces.length > 0 && !hasCaptured.current && !isCounting) {
	    hasCaptured.current = true;
	    setIsCounting(true);
	    setIsRecognizing(true);
	    setCountDown(3);
	    let count = 3;

	    const countdownInterval = setInterval(async () => {
	      count -= 1;
	      if (count === 0) {
	        clearInterval(countdownInterval);
	        setCountDown(null);
	        try {
	          if (!isRegistering) {
	            await apiHandler.handleFaceRecognition();
	          } else {
	            await apiHandler.handleFaceRegister();
	          }
	        } catch (err) {
	          console.error('countdown 내 에러:', err);
	          hasCaptured.current = false;
	          setIsCounting(false);
	          setIsRecognizing(false);
	        }
	      } else {
	        setCountDown(count);
	      }
	    }, 1000);
	  }
	};

	const apiHandler = (() => {
		return {
			handleFaceRecognition: async () => {
				try {
					// cameraRef null 체크
					if (!cameraRef.current) {
						console.warn('카메라 참조 없음');
						hasCaptured.current = false;
						setIsCounting(false);
						setIsRecognizing(false);
						return;
					}
					const photo = await cameraRef.current.takePictureAsync({
						skipProcessing: true,
						quality: 0.3,
						base64: false,
					});
					if (!photo?.uri) {
						console.warn('사진 캡처 실패: photo.uri 없음');
						hasCaptured.current = false;
						setIsCounting(false);
						setIsRecognizing(false);
						return;
					}
					const formData = new FormData();
					formData.append('file', {
						uri: photo.uri,
						name: 'face.jpg',
						type: 'image/jpeg',
					} as any);
					formData.append('collectionId', userState.groups.grpId);

					const response = await LoginService.verifyFace(authState, formData);
					const { result, resultCode } = response.data;

					if (resultCode == 200) {
						console.log('✅ 얼굴 인식 성공:', response.data.resultCode);
						if (result !== null) {
							await apiHandler.getUserLogin(result);
						} else {
							setIsFaceRegisterModalVisible(true);
						}
					} else if (resultCode === '9999') {
						console.log('❌ 얼굴 인식 실패:', response.data.resultCode, response.data.reason);
						hasCaptured.current = false;
						setIsCounting(false);
						setIsRecognizing(false);
					} else if (resultCode === '8888') {
						console.log('❌ 얼굴 인식 실패:', response.data.resultCode, response.data.reason);
						hasCaptured.current = false;
						setIsCounting(false);
						setIsRecognizing(false);
					}
				} catch (err) {
					console.error('❌ 얼굴 인식 실패:', err);
					hasCaptured.current = false;
					setIsCounting(false);
					setIsRecognizing(false);
				}
			},
			handleFaceRegister: async () => {
				try {
					// cameraRef null 체크
					if (!cameraRef.current) {
						console.warn('카메라 참조 없음');
						setRegistering(false);
						return;
					}
					const photo = await cameraRef.current.takePictureAsync({
						skipProcessing: true,
						quality: 0.3,
						base64: false,
					});
					if (!photo?.uri) {
						console.warn('사진 캡처 실패: photo.uri 없음');
						setRegistering(false);
						return;
					}
					const formData = new FormData();
					formData.append('file', {
						uri: photo.uri,
						name: 'face.jpg',
						type: 'image/jpeg',
					} as any);
					formData.append('collectionId', userState.groups.grpId);
					formData.append('userId', `${registerUserName}`);

					const response = await LoginService.registerFace(authState, formData);
					if (response.data.resultCode === 200) {
						console.log('✅ 얼굴 등록 성공');
						setRegistering(false);
					} else {
						console.log('❌ 얼굴 등록 실패:', response.data.reason);
						setRegistering(true);
					}
				} catch (e) {
					console.error('❌ 얼굴 등록 중 오류:', e);
					setRegistering(true);
				}
				setRegisterUserName('');
			},
			/**
			 * 사용자 정보 조회합니다.
			 */
			getUserLogin: async (userId: string) => {
				let userLoginId = userState.groups.grpId + userId;
				let requestAuthId: { loginId: string } = {
					loginId: userLoginId,
				};
				await AttendanceService.getUserLoginInfo(authState, requestAuthId)
					.then((res: AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any>) => {
						let { result, resultCode, resultMsg } = res.data;
						if (resultCode == SUCCESS_CODE.SELECT) {
							if (result) {
								console.log('✅ userInfo:', result);
								// userInfo 안전하게 spread
								setUserInfo((prev) => ({
									...(prev || {}),
									userSq: result['userSq'],
									userUuid: result['userUuid'],
									userNm: result['userNm'],
									loginUserId: userLoginId,
								}));
								apiHandler.requestAttendance(userLoginId);
							} else {
								console.log('[-] 회원 정보를 찾을 수 없습니다.', resultCode, result, resultMsg);
							}
						}
					})
					.catch((err) => {
						console.error(`[-] getUserLoginInfo() 함수에서 에러가 발생하였습니다 : ${err}`);
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
								dispatch(
									setUserData({
										userSq: userSq,
										userUuid: userUuid,
										userNm: userNm,
										loginId: loginId,
									}),
								);
								console.log('학습계획으로 이동!!');
							} else {
								console.log('[+] 로그인 중에 오류가 발생하였습니다.', resultCode, result, resultMsg);
							}
						} else {
							console.log('[+] 로그인 중에 오류가 발생하였습니다.', resultCode, result, resultMsg);
						}
					})
					.catch((err) => {
						console.error(`[-] requestAttendance() 함수에서 에러가 발생하였습니다 : ${err}`);
					});
			},
		};
	})();

	// ================================================================================================================================
	return (
		<SafeAreaView style={styles.container}>
			<StatusBar backgroundColor='#rgba(0, 0, 0, 0.8)' />

			<ScrollView style={styles.content}>
				<View style={styles.cameraFrame}>
					<View pointerEvents='none' style={styles.faceGuideContainer}>
						<View style={styles.faceOvalGuide} />
						{countDown !== null && (
							<View
								style={{
									position: 'absolute',
									top: '40%',
									alignSelf: 'center',
									backgroundColor: 'rgba(0, 0, 0, 0.6)',
									padding: 30,
									borderRadius: 20,
								}}>
								<Text style={{ color: 'white', fontSize: 60 }}>{countDown}</Text>
							</View>
						)}
					</View>

					{isCameraOn ? (
						<Camera
							style={styles.camera}
							type={CameraType.front}
							faceDetectorSettings={{
								mode: FaceDetector.FaceDetectorMode.accurate,
								detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
								runClassifications: FaceDetector.FaceDetectorClassifications.none,
								minDetectionInterval: 2000,
								tracking: false,
							}}
							ratio={'16:9'}
							onFacesDetected={handleFacesDetected}
							ref={cameraRef}
						/>
					) : (
						<View style={[styles.camera, { backgroundColor: '#17191c' }]} />
					)}
				</View>
			</ScrollView>
			<TouchableOpacity style={styles.btnNextFrame}>
				<Text style={styles.btnNext}>
					{hasCaptured.current ? '인식 완료!' : isRecognizing ? '얼굴 인식 중...' : '얼굴을 찾고 있어요'}
				</Text>
			</TouchableOpacity>

			{/* ============================================= 권한 팝업 영역 ================================================== */}
			<Modal animationType='fade' transparent={true} visible={isPermisModalOpen}>
				<View style={styles.modalContainer2}>
					<View style={styles.innerContainer}>
						<View style={styles.titleArea}>
							<Text style={styles.title1}>‘터그보트’ 이용을 위해</Text>
							<Text style={styles.title2}>다음의 앱 권한을 허용해주세요.</Text>
						</View>
						<View style={styles.titleBottomLine}></View>
						<View style={styles.permissionArea}>
							<View style={styles.permissionSubArea}>
								<Text style={styles.permissionTitle}>카메라 (필수)</Text>
								<Switch
									style={styles.permissionSwitch}
									trackColor={{ false: '#E4E6EB', true: '#B8CEFB' }}
									thumbColor={permisChecked ? '#6E90F7' : '#C5C9D0'}
									ios_backgroundColor='#3e3e3e'
									onValueChange={() => permissionChkHandler.toggleSwitch()}
									value={permisChecked}
								/>
							</View>
							<View style={styles.permissionContent}>
								<Text style={styles.permissionContentTxt}>공부모드 실행 시 AI리포트를 제공을 위해 필요합니다.</Text>
							</View>
						</View>
						<View style={styles.titleBottomLastLine}></View>
						<View>
							<Text style={styles.permissionAlertTxt}>* 위 접근권한은 더 나은 서비스를 제공하기 위해 사용됩니다.</Text>
						</View>
						<View style={styles.permissionBottonArea}>
							<TouchableOpacity style={styles.permissionBottonFrame} onPress={permissionChkHandler.cancleBtn}>
								<Text style={styles.permissionBottonTxt}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.permissionBottonFrame} onPress={permissionChkHandler.confirmBtn}>
								<Text style={styles.permissionBottonTxt}>확인</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			{/* ============================================= TOAST 메시지 팝업 ================================================== */}
			{isShowToast && (
				<Suspense fallback={<></>}>
					<ToastScreen
						height={50}
						marginTop={520}
						marginBottom={60}
						onClose={() => setIsShowToast(false)}
						message={`카메라 설정이 완료됐어요. \n 다음 단계로 넘어가요!`}
					/>
				</Suspense>
			)}

			{/* 얼굴 등록 모달 */}
			<Modal visible={isFaceRegisterModalVisible} transparent animationType='fade'>
				<View style={styles.modalContainer2}>
					<View style={styles.innerContainer}>
						<Text style={styles.title1}>등록되지 않은 얼굴입니다</Text>
						<Text style={styles.title2}>출결번호를 입력하고 등록하시겠습니까?</Text>
						<TextInput
							style={{
								borderWidth: 1,
								borderColor: '#ccc',
								backgroundColor: 'white',
								paddingHorizontal: 10,
								paddingVertical: 8,
								marginTop: 10,
								borderRadius: 8,
							}}
							placeholder='출결번호'
							value={registerUserName}
							onChangeText={setRegisterUserName}
						/>
						<View style={styles.permissionBottonArea}>
							<TouchableOpacity
								style={styles.permissionBottonFrame}
								onPress={() => {
									setIsFaceRegisterModalVisible(false);
									setRegisterUserName('');
								}}>
								<Text style={styles.permissionBottonTxt}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.permissionBottonFrame}
								onPress={async () => {
									setIsFaceRegisterModalVisible(false);
									hasCaptured.current = false;
									setIsCounting(false);
									setIsRecognizing(false);
									setRegistering(true);
								}}>
								<Text style={styles.permissionBottonTxt}>등록</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};
export default memo(StudyReadyScreen);
