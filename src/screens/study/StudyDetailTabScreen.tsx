import { Alert, Dimensions, Image, LayoutAnimation, Modal, Pressable, SafeAreaView, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { ScrollView, TouchableHighlight } from 'react-native-gesture-handler';
import styles from "./styles/StudyDetailTabScreenStyles"
import { NavigationState, SceneMap, SceneRendererProps, TabBar, TabView } from "react-native-tab-view";
import TbStdyDoDtlModules from "../../modules/sqlite/TbStdyDoDtlModules";
import { useEffect, useState } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import { StudyType } from "../../types/StudyType";
import { useDispatch, useSelector } from "react-redux";
import AuthenticationManager from "../../modules/auth/AuthenticationManager";
import StudyService from "../../services/study/StudyService";
import { AxiosResponse } from "axios";
import { SUCCESS_CODE } from "../../common/utils/codes/CommonCode";
import { StampPblsType } from "../../types/StampPblsType";
import StampPblsService from "../../services/stamp/StampPblsService";
import { CommonType } from "../../types/common/CommonType";
import { RootState } from "../../modules/redux/RootReducer";
import { Text } from "react-native";
import { Switch } from "react-native-gesture-handler";
import NetInfo from "@react-native-community/netinfo";
import FastImage from "react-native-fast-image";


/**
 * 학습 상세 탭을 출력합니다.
 * @param doSq 학습 시퀀스
 * @param studyMode 학습 모드 ("PURE" | "BOOST" | "TIMER")
 * @param navigation 페이지 네비게이션
 * @param stopwatchRef 스탑워치 속성
 * @param selectOnlineUserList 학교 학생들 리스트(함수)
 * @param onSetOpenDtlTab 탭 변환 함수
 * @param isOpenDetailView 탭 출력 여부
 * @param onSetIsUsingStudent 현재 공부중인 친구만 보기가 선택된지 여부 
 */
const StudyDetailTabScreen = ({
    doSq,
    studyMode,
    navigation,
    stopwatchRef,
    mySchoolUserList,
    selectOnlineUserList,
    onSetOpenDtlTab,
    isOpenDetailView = false,
    onSetIsUsingStudent

}: StudyType.StudyDetailProps) => {

    const { isConnected } = useNetInfo();                                                   // netwrok-info를 이용해서 네트워크 상태를 체크

    // =================================================================== 전역 속성 관리 ===================================================================
    const dispatch = useDispatch();
    const authManager = AuthenticationManager.getInstance(navigation, dispatch);
    const authState = useSelector((state: RootState) => state.authInfo);
    const reduxUserInfo = useSelector((state: RootState) => state.userInfo);
    const reduxStudyPlan = useSelector((state: RootState) => state.studyInfo);

    // =================================================================== 공부 상세 보기 관련 상태 관리 ===================================================================
    const [index, setIndex] = useState(0);            // Tab 관리
    const [routes] = useState([
        {
            key: 'first', title: studyMode === 'PURE' ? '순공모드'
                : studyMode === 'BOOST' ? '순공 + 열공모드'
                    : studyMode === "TIMER" ? '타이머 모드' : ""
        },
        { key: 'second', title: '우리학교' },
    ]);
    const [slideUp, setSlideUp] = useState(false);          // 공부 상세보기 슬라이드 업/다운
    const [userDetailItem, setUserDetailItem] = useState({
        todayRanking: 0,
        monthRanking: 0,
        userNickNm: "",
    });

    const [isEnabled, setIsEnabled] = useState(false);                                                  // 현재 공부중인 친구만 보기
    const [mySchoolDtlModalVisible, setMySchoolDtlModalVisible] = useState<boolean>(false);             // 우리학교 상세 팝업 출력

    /**
   * 학습에서 수행되는 API 호출과 관련된 처리를 관리하는 Handler
   */
    const apiHandler = (() => {
        return {

            /**
             * 학습 실행(TB_STUDY_DO_END) 테이블 INSERT
             * @param {StudyType.StudyDoEndDto} studyDoEnd 학습 실행 종료 정보
             * @return {Promise<void>} 별도 처리 없음
             */
            insertStudyDoEnd: async (studyDoEnd: StudyType.StudyDoEndDto): Promise<void> => {
                await authManager.refresh(authState)
                    .then((userInfo) => StudyService.insertStudyDoEnd(userInfo, studyDoEnd))
                    .then((res: AxiosResponse<StudyType.StudyDoEndDto & CommonType.apiResponseType, any>) => {
                        let { result, resultCode } = res.data
                        // 등록에 성공하였을 경우
                        if (resultCode === SUCCESS_CODE.INSERT && result === 1) {
                            console.log("[+] 등록에 성공하였습니다.")
                            navigation.replace("bottomTabNav");            // Home으로 이동합니다.
                        }
                        else console.log("[-] 등록에 실패하였습니다. 관리자에게 문의해주세요")
                    })
                    .catch((err) => console.error(`apiHandler.insertStudyDoEnd() 함수에서 에러가 발생하였습니다`, err));
            },

            /**
             * 스템프 테이블에 데이터를 저장합니다.
             * @param stampPbls
             */
            insertStampPbls: async (stampPbls: StampPblsType.StampPblsDto) => {

                // [API] 스템프 테이블에 등록합니다.
                await authManager.refresh(authState)
                    .then((userInfo) => StampPblsService.insertStampPbls(userInfo, stampPbls))
                    .then((res) => {
                        let { result, resultCode } = res.data;

                        if (resultCode === SUCCESS_CODE.INSERT && result === 1) {
                            navigation.replace("bottomTabNav");        // 닫기 버튼 선택시 Home으로 이동
                        }
                    })
                    .catch((err) => console.error("apiHandler.insertStampPbls() 메서드에서 에러가 발생하였습니다 : ", err));
            }
        }
    })();

    /**
   * 우리학교는 탭에서 동작하는 함수들을 관리하는 Handler
   */
    const mySchoolHandler = (() => {

        return {
            /**
             * "현재 공부중인 학생만 보기" on/off 스위치
             * @return {void}
             */
            toggleSwitch: async (): Promise<void> => {
                // 네트워크가 연결되지 않는 상태에서 호출하는 경우
                if (!isConnected) {
                    commonHandler.disconnectNetworkAlert()
                    setSlideUp(false);
                    return;
                }
                const switchToogle = !isEnabled
                setIsEnabled(switchToogle);                     // 현재 공부중인 학생에 대한 Switch 변경
                await selectOnlineUserList(true, switchToogle); // [부모 상태 변경] 현재 공부중인 학생에 대한 리스트 변경        
                onSetIsUsingStudent(switchToogle);              // [부모 상태 변경] 현재 공부중인 학생 갱신 상태 변경
            },
            /**
             * 나의 학교는 상세 팝업을 열어줍니다.
             * @param item
             */
            loadProfileDetail: (item: StudyType.StudyOnlineUserListDto) => {

                // 네트워크가 연결되지 않는 상태에서 호출하는 경우
                if (!isConnected) {
                    commonHandler.disconnectNetworkAlert()
                    setSlideUp(false);
                    return;
                }

                setMySchoolDtlModalVisible(true);
                // setMySchoolActiveIdx(idx)
                setUserDetailItem({
                    todayRanking: item.todayRanking!,
                    monthRanking: item.monthRanking!,
                    userNickNm: item.userNickNm!,
                })
            },

            /**
             * 나의 학교 상세를 닫아줍니다.
             */
            closeMySchoolDtl: () => {
                setMySchoolDtlModalVisible(false);
            },


            /**
             * 현재 날짜를 문자열로 반환해줍니다.
             * @param isUseDay
             * @returns
             */
            nowDateToStr: (isUseDay: boolean): string => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const date = String(today.getDate()).padStart(2, '0');
                return isUseDay ? `${year}년 ${month}월 ${date}일` : `${year}년 ${month}월`;
            }
        }
    })();


    /**
     * 일반적인 핸들러
     */
    const commonHandler = (() => {
        return {
            /**
             * 네트워크 연결이 끊겼을때, 메시지를 출력합니다.
             * @returns
             */
            disconnectNetworkAlert: (): void => {
                console.log("네트워크 연결이 끊겼습니다.");
                Alert.alert("네트워크 연결이 끊겼습니다.", " 디바이스 연결 상태를 확인해주세요.");
                return
            },

            checkNetwork: () => {
                console.log("???????????????")
                console.log("네트워크 상태 체크 ", isConnected)
            }

        }
    })()


    /**
       * 학습 상세정보를 관리하는 Handler
       */
    const studyDtlHandler = (() => {
        return {

            /**
             * 탭바의 UI를 구성합니다.
             * @param {SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string }> }} props
             * @returns {React.JSX.Element}
             */
            renderTabBar: (props: SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string }> }): React.JSX.Element => (
                <TabBar
                    {...props}
                    renderTabBarItem={studyDtlHandler.renderTabBarItem}
                    style={styles.stdyTabFrame}
                    indicatorStyle={{
                        backgroundColor: 'transparent',
                    }}
                />),

            /**
             * 탭바의 속성을 구성합니다.
             * @param param0
             * @returns {React.JSX.Element }
             */
            renderTabBarItem: ({ route }): React.JSX.Element => (
                route.key === "first" ?
                    // 공부모드 탭
                    <TouchableOpacity
                        style={index === 0 ? styles.stdTabActiveViewFrame : styles.stdTabUnActiveViewFrame}
                        onPress={() => studyDtlHandler.onpressTab(0)}>
                        <Text style={index === 0 ? styles.activeTxt : styles.unActiveTxt}>{route.title}</Text>
                    </TouchableOpacity>
                    :
                    <TouchableOpacity
                        style={index === 1 ? styles.sclTabActiveViewFrame : styles.sclTabUnActiveViewFrame}
                        onPress={() => studyDtlHandler.onpressTab(1)}>
                        <Text style={index === 1 ? styles.activeTxt : styles.unActiveTxt}>{route.title}</Text>
                    </TouchableOpacity>
            ),
            /**
            * 탭 구성
            */
            renderScene: SceneMap({
                first: () => <></>,
                second: () => <></>,
            }),

            /**
            * "공부 상세보기" 슬라이드 업/다운을 수행하는 토글 함수
            * @return {void}
            */
            toggleSlide: (): void => {

                // 네트워크가 연결되지 않는 상태에서 호출하는 경우
                if (!isConnected) {
                    commonHandler.disconnectNetworkAlert()
                    setSlideUp(false);
                    return;
                }
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSlideUp(!slideUp);
                onSetOpenDtlTab(!slideUp);
                studyDtlHandler.onpressTab(0);
            },
            /**
             * 탭을 선택하였을때 슬라이드 업/다운을 수행하고 탭을 이동합니다.
             * @param {number} idx
             * @return {void}
             */
            onpressTab: (idx: number): void => {
                // 네트워크가 연결되지 않는 상태에서 호출하는 경우
                if (!isConnected) {
                    commonHandler.disconnectNetworkAlert()
                    setSlideUp(false);
                    return;
                }
                setIndex(idx)
            }
            ,
            /**
             * 전달받은 밀리초 단위를 데이터 format을 맞춰서 반환합니다.
             * @param {number} second
             * @returns {string} 계산된 시간 값을 반환합니다.
             */
            loadAccTotalMinute: (second?: number): string => {
                let formattedTime = "-";
                if (second) {
                    const hours = Math.floor(second / 3600);
                    const minutes = Math.floor((second % 3600) / 60);

                    // 1분 미만인 경우 수행하지 않음
                    if (minutes > 0) {
                        formattedTime = hours.toString().padStart(2, '0') + '시간 ' + minutes.toString().padStart(2, '0') + '분';
                    }
                }

                return formattedTime;
            },

            /**
             * 학습 마무리 처리
             */
            finalStdyEnd: async () => {

                // [STEP1] [SQlite]내에서 데이터 존재여부를 반환받습니다.
                const stdyDtlCnt = await TbStdyDoDtlModules.selectStdyDtlCnt(doSq)

                // [CASE2-1] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우 : doSq로만 학습 종료 테이블을 등록합니다.
                if (stdyDtlCnt === 0) {
                    console.log("[+] 데이터가 존재하지 않는 경우에 대한 처리 ")
                    const selectStdyDoDtlAvg: StudyType.StudyDoDtlSQliteDto = {
                        doSq: doSq,
                        regTs: "",
                        msrdSecs: 0,
                        msrdCnt: 0,
                        faceDtctYn: 0,
                        exprCd: "",
                        valence: 0,
                        arousal: 0,
                        emtnCd: "",
                        atntn: 0,
                        strss: 0,
                        strtTs: "",
                        endTs: "",
                        studyDoExprDtoList: [],
                        studyDoEmtnDtoList: []
                    }
                    await apiHandler.insertStudyDoEnd(selectStdyDoDtlAvg)
                }

                /*
                * [CASE2-2] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우
                * - 1. SQLITE 내에 DTL 테이블로 평균값을 추출합니다
                * - 2. SQLITE 내에 DTL 테이블로 감정(EMTN)을 추출합니다
                * - 3. SQLITE 내에 DTL 테이블로 표현(EXPR)을 추출합니다
                * - 4. API 서버로 모든 데이터를 전송합니다.
                * - 5. SQLITE 내에 DTL 테이블 데이터 초기화
                */
                else {
                    const { selectStdyDoDtlAvg, selectStudyDoEmtn, selectStudyDoExpr } = TbStdyDoDtlModules
                    const selectStdyDoDtlAvgRlt = await selectStdyDoDtlAvg(doSq);   // 1. [SQLite] TB_STDY_DO_DTL 평균 조회
                    selectStdyDoDtlAvgRlt.doSq = doSq;
                    const studyDoEmtnList = await selectStudyDoEmtn(doSq);           // 2. [SQLite]TB_STDY_DO_DTL 기반 감정(EMTN) 조회
                    const studyDoExprList = await selectStudyDoExpr(doSq);           // 3. [SQLite]TB_STDY_DO_DTL 기반 표현(EXPR) 조회
                    selectStdyDoDtlAvgRlt.studyDoEmtnDtoList = studyDoEmtnList;
                    selectStdyDoDtlAvgRlt.studyDoExprDtoList = studyDoExprList;
                    await apiHandler.insertStudyDoEnd(selectStdyDoDtlAvgRlt);        // 4. [SQLite]API 서버로 모든 데이터를 전송합니다.
                }
                await TbStdyDoDtlModules.deleteStudyDoDtl(doSq);                     // 5. [SQLite] SQLITE 내에 DTL 테이블 데이터 초기화
                await TbStdyDoDtlModules.selectStdyDoDtlList(doSq);                                           // TODO : 완전 삭제되었는지 한번 체크
            },

        }
    })();


    return (

        <SafeAreaView style={{ flex: 1 }}>
            {
                !isOpenDetailView ?
                    // 접혀 있는 상태에서 공부 상세보기
                    <View style={styles.dtlViewNoFrame}>
                        <View style={styles.dtlContainer}>
                            <TouchableOpacity style={styles.stdDtlFrame} onPress={studyDtlHandler.toggleSlide}>
                                <Text style={styles.stdDtlTxtUnActive}>공부 상세보기</Text>

                                <FastImage
                                    style={styles.stdDtlIcon}
                                    source={slideUp ?
                                        require("../../../assets/images/icons/ic_l_fold_gray_20.png")
                                        : require("../../../assets/images/icons/ic_l_show_gray_20.png")}
                                    resizeMode={FastImage.resizeMode.contain} />
                            </TouchableOpacity >
                        </View>
                    </View>
                    :
                    // 펼쳐져 있는 상태에서 공부 상세보기 
                    <View style={styles.dtlViewFrame}>
                        <View style={styles.dtlContainer}>
                            <TouchableOpacity style={styles.stdDtlFrame} onPress={studyDtlHandler.toggleSlide}>
                                <Text style={styles.stdDtlTxtActive}>공부 상세보기 </Text>
                                <FastImage
                                    style={styles.stdDtlIcon}
                                    source={slideUp ?
                                        require("../../../assets/images/icons/ic_l_fold_gray_20.png")
                                        : require("../../../assets/images/icons/ic_l_show_gray_20.png")}
                                    resizeMode={FastImage.resizeMode.contain} />
                            </TouchableOpacity >

                            {/* ================================ 슬라이드 업이 되었을때 ========================================================= */}
                            {slideUp &&
                                // ======================================= 탭 뷰를 출력===========================================================
                                <View style={{ backgroundColor: "#2e3138" }}>
                                    <TabView
                                        navigationState={{ index, routes }}
                                        renderTabBar={studyDtlHandler.renderTabBar}
                                        renderScene={
                                            SceneMap({
                                                first: () => <></>,
                                                second: () => <></>,
                                            })}
                                        onIndexChange={setIndex}
                                        initialLayout={{ width: Dimensions.get('window').width }}
                                    />
                                    {
                                        index === 0
                                            ?
                                            // ======================================= 탭1: 공부 모드 탭 영역 =======================================
                                            <View style={styles.stdDtlViewFrame}>
                                                <View style={styles.stdTabViewArea1}>
                                                    <View style={styles.stdTabViewFrame1}>
                                                        <Text style={styles.stdTabViewTitle}>오늘 공부한 시간</Text>
                                                        <Text style={styles.stdTabViewTxt1}>
                                                            {studyDtlHandler.loadAccTotalMinute(stopwatchRef.current?.getNowSec())}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.stdTabViewFrame2}>
                                                        <Text style={styles.stdTabViewTitle}>공부 계획</Text>
                                                        <Text style={styles.stdTabViewTxt2}>{reduxStudyPlan.planNm} </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            :
                                            // =============================== 탭2: 현재 공부중인 친구만 보기 영역 ================================
                                            <View style={styles.stdDtlViewFrame2}>
                                                <View style={styles.schlDtlViewArea1}>
                                                    <Text style={styles.shlDtlView1Txt} onPress={mySchoolHandler.toggleSwitch}>현재 공부중인 친구만 보기</Text>
                                                    <Switch
                                                        style={styles.schlDtlView1Switch}
                                                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                                                        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
                                                        ios_backgroundColor="#3e3e3e"
                                                        onValueChange={mySchoolHandler.toggleSwitch}
                                                        value={isEnabled}
                                                    />
                                                </View>


                                                <ScrollView contentContainerStyle={{
                                                    flexGrow: 1,
                                                    justifyContent: 'flex-start'
                                                }}>
                                                    <View style={styles.schlDtlViewArea2}>
                                                        {
                                                            mySchoolUserList.length > 0 ?
                                                                mySchoolUserList.map((item, idx) =>
                                                                    <View key={`userList-${idx}`}
                                                                        style={[styles.schlDtlViewUnActiveItem1, reduxUserInfo.userSq === item.userSq! && styles.schlDtlViewActiveItem1]}>

                                                                        <TouchableOpacity onPress={() => mySchoolHandler.loadProfileDetail(item)}>
                                                                            <Image
                                                                                style={item.online ? styles.schlDtlViewItemImg : styles.schlDtlViewItemImgOffline}
                                                                                resizeMode="cover"
                                                                                source={
                                                                                    item.online
                                                                                        ? require('../../../assets/images/icons/ic_l_tugbot_62.png')
                                                                                        : require('../../../assets/images/icons/ic_l_tugbot_62_gray.png')
                                                                                } />

                                                                            <Text style={item.online ? styles.schlDtlViewItemNickName : styles.schlDtlViewItemNickNameOffline}>
                                                                                {item.userNickNm}
                                                                            </Text>
                                                                            <View>
                                                                                <Text style={item.online ? styles.schlDtlViewItemToday : styles.schlDtlViewItemTodayOffline}>
                                                                                    오늘 {item.todayStdyTm}
                                                                                </Text>
                                                                            </View>
                                                                            <View>
                                                                                <Text style={item.online ? styles.schlDtlViewItemWeek : styles.schlDtlViewItemWeekOffline}>
                                                                                    이번달 {item.monthStdyTm}
                                                                                </Text>
                                                                            </View>
                                                                        </TouchableOpacity>

                                                                    </View>
                                                                )
                                                                :
                                                                <View style={styles.schlDtlViewNoFrame}>
                                                                    <Image source={require('../../../assets/images/icons/ic_d_study_darkgary_42.png')} style={styles.schlDtlViewNoIcon} resizeMode="cover" />
                                                                    <Text style={styles.schlDtlViewNoTxt}>현재 공부중인 친구가 없어요!</Text>
                                                                </View>
                                                        }
                                                    </View>
                                                </ScrollView>
                                            </View>
                                    }
                                </View>
                            }
                        </View>
                    </View>

            }

            {/* ======================================== 우리학교 탭: 프로필 상세 출력 ========================================*/}
            <Modal
                animationType="fade"
                transparent={true}
                visible={mySchoolDtlModalVisible}>
                <View style={styles.centeredView}>
                    <View style={styles.profileDtlFrame}>
                        <View style={styles.profileDtlTitleFrame}>
                            <View>
                                <Text style={styles.profileDtlTitle}> 프로필 상세 </Text>
                            </View>
                            <TouchableOpacity
                                onPress={mySchoolHandler.closeMySchoolDtl}
                                style={styles.profileDtlCloseIconFrame}>
                                <Image source={require('../../../assets/images/icons/ic_l_close_gray_28.png')} resizeMode="cover" style={styles.profileDtlCloseIcon} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.profileBadgeFrame}>
                            <View style={styles.profileBadgeBackground}>
                                <Image source={require('../../../assets/images/icons/ic_l_tugbot_62.png')} style={styles.profileBadgeImage} />
                            </View>
                        </View>

                        <View style={styles.profileNicknameFrame}>
                            <Text style={styles.profileNickname}>{userDetailItem.userNickNm}</Text>
                        </View>
                        <View style={styles.todayRankingArea}>
                            <View >
                                <Text style={styles.todayRankingTitle}>오늘 랭킹</Text>
                            </View>
                            <View style={styles.todayRainkingBestFrame}>
                                <Image source={userDetailItem.todayRanking === 1 ? require('../../../assets/images/icons/ic_l_crown_40.png') : require('../../../assets/images/icons/ic_l_crown_ligthgray_40.png')} style={styles.rankingBestIcon} resizeMode="cover" />
                                <Text style={styles.rankingBestNumTxt}>{userDetailItem.todayRanking}</Text>
                                <Text style={styles.rankingBestTxt}>등</Text>
                            </View>
                            <View style={styles.nowTimeArea}>
                                <Text style={styles.nowTimeTxt}>{`${mySchoolHandler.nowDateToStr(true)} 기준`}</Text>
                            </View>
                        </View>

                        <View style={styles.monthRankingArea}>
                            <View >
                                <Text style={styles.rankingTitle}>주간 랭킹</Text>
                            </View>
                            <View style={styles.monthlyRainkingBestFrame}>
                                <Image source={userDetailItem.monthRanking === 1 ? require('../../../assets/images/icons/ic_l_crown_40.png') : require('../../../assets/images/icons/ic_l_crown_ligthgray_40.png')} style={styles.rankingBestIcon} resizeMode="cover" />
                                <Text style={styles.rankingBestNumTxt}>{userDetailItem.monthRanking}</Text>
                                <Text style={styles.rankingBestTxt}>등</Text>
                            </View>
                            <View style={styles.nowTimeArea}>
                                <Text style={styles.nowTimeTxt}>{`${mySchoolHandler.nowDateToStr(false)} 기준`}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    )

}
export default StudyDetailTabScreen;
