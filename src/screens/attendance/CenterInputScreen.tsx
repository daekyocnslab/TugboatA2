import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	TextInput,
	StyleSheet,
	Text,
	TouchableOpacity,
	Alert,
	Platform,
	Linking,
	Modal,
	Switch,
	SafeAreaView,
	Keyboard,
} from 'react-native';
import styles from './styles/CenterInputScreenStyle';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../modules/redux/RootReducer';
import AuthenticationManager from '../../modules/auth/AuthenticationManager';
import { AdminCliLogin } from '../../modules/auth/AdminCliLogin';
import { LoginMethod, SUCCESS_CODE } from '../../common/utils/codes/CommonCode';
import { GroupType } from '../../types/GroupType';
import groupService from '../../services/common/GroupService';
import { setGroup } from '../../modules/redux/slice/UserSlice';
import PermissionUtil from '../../common/utils/PermissionUtil';
import CustomModal from '../../components/modal/CustomModal';
import DeviceInfoUtil from "../../common/utils/DeviceInfoUtil";
import NetInfo, { NetInfoSubscription, useNetInfo } from "@react-native-community/netinfo";
import { check, request, openSettings, PERMISSIONS, RESULTS, requestMultiple } from 'react-native-permissions';
import { useCameraPermission } from "react-native-vision-camera";

const CenterInputScreen = ({ navigation }) => {

	const { isConnected } = useNetInfo();

	const [inputValue, setInputValue] = useState('');

	// =================================================================== 전역 속성 관리 ===================================================================
	const dispatch = useDispatch();
	const userState = useSelector((state: RootState) => state.userInfo); // Redux 저장소에서 데이터를 조회해옵니다.
	const authState = useSelector((state: RootState) => state.authInfo); // Redux 저장소에서 데이터를 조회해옵니다.

	const authManager = AuthenticationManager.getInstance(navigation, dispatch); //인증 관련 기능 제공하는 매니저 클래스

	const keycloakConfig = AdminCliLogin.getInstance().keycloakConfig; // 키클락 설정

	const [isCameraOn, setIsCameraOn] = useState(true); // 카메라의 온오프 여부
	const { hasPermission, requestPermission } = useCameraPermission()
	// ====================================== 권한 모달 팝업 관리 ==============================
	const [permisChecked, setPermisChecked] = useState(false); // 권한 허용여부
	const [isPermisModalOpen, setIsPermisModalOpen] = useState(false); // 권한 모달
	const [isShowToast, setIsShowToast] = useState<boolean>(false); // ToastMessage 출력 여부

	//알림 모달 관련
	const [isAlertVisible, setIsAlertVisible] = useState(false);
	const [alertTitle, setAlertTitle] = useState('');
	const [alertMessage, setAlertMessage] = useState('');
	const [alertConfirmAction, setAlertConfirmAction] = useState<() => void>(
		() => { },
	);

	//확인 모달 관련
	const [isConfirmVisible, setIsConfirmVisible] = useState(false);
	const [confirmTitle, setConfirmTitle] = useState('');
	const [confirmMessage, setConfirmMessage] = useState('');
	const [confirmAction, setConfirmAction] = useState<() => void>(
		() => { },
	);

	const inConnectNetworkRef = useRef<boolean>(true);              // 네트워크의 연결 여부를 체크합니다.

	useEffect(() => {
		return () => {
			Keyboard.dismiss();
		};
	}, []);

	/**
	 *  시작하자마자 실행합니다.
	 */
	useEffect(() => {
		const init = () => {
			try {
				DeviceInfoUtil.hardwareBackRemove(navigation, true); // 안드로이드 뒤로가기 방지

				commonHandler.networkChangeCheckListener(); //네트워크 연결에 상태를 감지하는 리스너를 등록합니다

				// [STEP5] 해당 페이지에 최초 들어왔을 경우 '권한체크'를 수행합니다.
				permissionChkHandler
					.checkPermission()
					.then((res) => res && setIsCameraOn(true));

				if (!authState.adminCliAccessToken) {
					authManager.adminCLiLogin(LoginMethod.SERVICE, keycloakConfig);
				}

				if (userState.groups && userState.groups['grpSq'] != 0) {
					console.log('그룹', userState.groups);
					console.log('그룹', userState.groups['grpNm']);
					navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
					// navigation.navigate('attendance');
				} else {
					console.log('[+] 센터 정보를 찾을 수 없습니다.');
				}

				console.log('userState --> ', userState)
				console.log('authState --> ', authState)
			} catch (error) {
				console.error('[-] Initialization failed:', error);
			}
		};

		init();
	}, []);

	const cameraPerm = Platform.select({
		ios: PERMISSIONS.IOS.CAMERA,
		android: PERMISSIONS.ANDROID.CAMERA,
	});
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
					const notGradtedArr = await PermissionUtil.cmmPermsArrCheck([
						_cameraAndroidPermis,
					]);
					if (notGradtedArr.length > 0) {
						setIsPermisModalOpen(true);
						hasPermission = false;
					}
				} else if (Platform.OS === 'ios') {
					// 1. 카메라 권한을 확인합니다.
					const permisCameraArr = await PermissionUtil.cmmPermsArrCheck([
						_cameraIOSPermis,
					]);
					if (permisCameraArr.length > 0) {
						setIsPermisModalOpen(true);
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

					const status = await request(PERMISSIONS.IOS.CAMERA);
					console.log('status', status);
					if (status === 'granted') {
						setPermisChecked(true);
					} else if (status === 'denied') {
						// openSettings()
						const status = await request(PERMISSIONS.IOS.CAMERA);
						if (status === 'granted') setPermisChecked(true);
					} else {
						Linking.openSettings(); // 핸드폰 상 설정 페이지
					}
				}
				// [CASE2] Switch를 false로 변경한 경우 : 아무 행동도 하지 않음.
				else {
					setPermisChecked(!permisChecked);
				}
			},
		};
	})();

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
				console.log("[+] 연결 상태 확인");
				return NetInfo.addEventListener(state => {
					inConnectNetworkRef.current = state.isConnected!;   // 연결 상태를 변수로 저장합니다.
					// 네트워크 연결이 끊겼을때, 학습을 중단시키고 팝업을 출력합니다.
					if (!inConnectNetworkRef.current) {
						commonHandler.disconnectNetworkAlert();
					};
				});
			},

			/**
			 * 네트워크 연결이 끊겼을때, 메시지를 출력합니다.
			 * @returns
			 */
			disconnectNetworkAlert: (): void => {
				console.log("네트워크 연결이 끊겼습니다.");
				setAlertTitle('알림');
				setAlertMessage('네트워크 연결을 확인해주세요.');
				setAlertConfirmAction(() => () => setIsAlertVisible(false));
				setIsAlertVisible(true);
				return
			},

		}
	})()

	const apiHandler = (() => {
		return {
			/**
			 * 그룹 리스트 조회
			 */
			selectGrpListByAdmin: async (groupInfo: GroupType.GroupInfo) => {
				try {
					const res = await groupService.selectGroupListByAdmin(
						authState,
						groupInfo,
					);

					const { result, resultCode, resultMsg } = res.data;
					if (resultCode === SUCCESS_CODE.SELECT) {
						return result;
					} else {
						console.log(
							'[-] 그룹 정보를 가져오는 중에 오류가 발생하였습니다.:',
							resultMsg,
						);
					}
				} catch (error) {
					console.error(
						'[-] 그룹 정보를 가져오는 중에 오류가 발생하였습니다.:',
						error,
					);
				}
			},
		};
	})();

	const handleInputChange = (text: string) => {
		// 영문자와 숫자만 허용 (정규식 사용)
		const filteredText = text.replace(/[^a-zA-Z0-9]/g, '');
		setInputValue(filteredText);
	};

	const handleConfirm = async () => {
		// 네트워크 연결 상태를 최종적으로 한 번 더 확인
		if (isConnected === false) {
			commonHandler.disconnectNetworkAlert(); // 네트워크 연결이 끊겼을 때 팝업 출력
			return; // 화면 전환 중단
		}

		// ✅ 키보드 닫기 추가
		Keyboard.dismiss();

		const data: GroupType.GroupInfo = {
			grpId: inputValue,
		};

		// 인증코드에 따른 그룹 조회
		const groups: GroupType.GroupInfo[] = await apiHandler.selectGrpListByAdmin(
			data,
		);

		if (groups && groups.length > 0) {
			if (groups[0]['grpSq'] != 0) {
				// 리덕스 정보 초기화
				dispatch(setGroup(groups[0]));

				// // 센터 이름 확인 후 알림창 표시
				// 모달을 통한 확인 메시지 표시
				setConfirmTitle(`"${groups[0].grpNm}"`);
				setConfirmMessage('으로 등록하시겠습니까?');
				setConfirmAction(() => {
					return () => {
						// 알림창에서 확인 버튼을 눌렀을 때만 화면 전환
						setIsConfirmVisible(false);
						Keyboard.dismiss(); // ✅ 모달 확인 시에도 키보드 닫기
						navigation.navigate('LOGIN_SELECT');
					};
				});
				setIsConfirmVisible(true);
			}
		} else {
			setAlertTitle('알림');
			setAlertMessage('올바른 센터 코드를 입력해주세요.');
			setAlertConfirmAction(() => () => setIsAlertVisible(false));
			setIsAlertVisible(true);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.contentsWrapper}>
				{/*상단 영역*/}
				<View style={styles.contents}>
					{/*{process.env.REACT_NATIVE_APP_MODE !== 'prd'?*/}
					{/*	<Text style={styles.envLabelText}>{process.env.REACT_NATIVE_APP_MODE}</Text>*/}
					{/*	:<></>}*/}
					<View style={styles.main}>
						{/* 제목 */}
						<Text style={styles.header}>센터코드 입력</Text>
						<TextInput
							style={styles.input}
							value={inputValue}
							onChangeText={handleInputChange}
							placeholder='센터코드를 입력하세요'
							keyboardType='default'
							autoCapitalize='none'
							maxLength={15}
						/>
						<TouchableOpacity style={styles.button} onPress={handleConfirm}>
							<Text style={styles.buttonText}>확인</Text>
						</TouchableOpacity>

						<View style={styles.infoWrapper}>
							<Text style={styles.infoText}>센터코드를 입력하세요.</Text>
							<Text style={styles.infoText}>
								센터코드를 모르시는 경우,
							</Text>
							<Text style={styles.infoText}>02-829-1642로 문의해주십시오.</Text>
						</View>
					</View>
				</View>
			</View>
			{/* ============================================= 알림 모달 영역 ================================================== */}
			<CustomModal
				visible={isAlertVisible}
				onClose={() => setIsAlertVisible(false)}
				title={alertTitle}
				message={alertMessage}
				confirmText='확인'
				onConfirm={alertConfirmAction}
				cancelText={null}
				onCancel={null}
			/>
			{/* ============================================= 확인 모달 영역 ================================================== */}
			<CustomModal
				visible={isConfirmVisible}
				onClose={() => setIsConfirmVisible(false)}
				title={confirmTitle}
				message={confirmMessage}
				confirmText='확인'
				onConfirm={confirmAction}
				cancelText='취소'
				onCancel={() => setIsConfirmVisible(false)}
			/>
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
								<Text style={styles.permissionContentTxt}>
									공부모드 실행 시 AI리포트를 제공을 위해 필요합니다.
								</Text>
							</View>
						</View>
						<View style={styles.titleBottomLastLine}></View>
						<View>
							<Text style={styles.permissionAlertTxt}>
								* 위 접근 권한은 더 나은 서비스를 제공하기 위해 사용됩니다.
							</Text>
						</View>
						<View style={styles.permissionBottonArea}>
							<TouchableOpacity
								style={styles.permissionBottonFrame}
								onPress={permissionChkHandler.confirmBtn}>
								<Text style={styles.permissionBottonTxt}>확인</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

export default CenterInputScreen;
