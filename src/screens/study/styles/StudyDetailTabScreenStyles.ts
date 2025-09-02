import DementionUtils from "../../common/utils/DementionUtils";
import DeviceInfoUtil from "../../common/utils/DeviceInfoUtil";
import { Platform, StyleSheet } from "react-native";

const { heightRelateSize, widthRelateSize, fontRelateSize, marginRelateSize } = DementionUtils

const customHeight = 704

const styles = StyleSheet.create({

    container: {
        flex: 1,
    },

    /**
    * 영역 -3 : 비정상적 종료 팝업
   */
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: "center",
        textAlignVertical: 'center',
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },

    /**
     * 영역 2 : 함께 공부중인 학생
     */
    // 하단에 고정하는 Container 적용
    dtlContainer: {
        flex: 1,
        position: 'absolute',
        bottom: 0,
    },
    stdDtlFrame: {
        // flex: 1,
        flexDirection: "row",
        width: widthRelateSize(360),
        height: heightRelateSize(60),
        backgroundColor: "#2e3138",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        // bottom: heightRelateSize(Platform.OS === "ios" ? 0 : 15),
        justifyContent: "center",
        alignItems: "center"
    },
    stdDtlTxtActive: {
        width: widthRelateSize(296),
        height: heightRelateSize(22, customHeight),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(20),
        // marginTop: heightRelateSize(20, customHeight),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#f0f1f2",
    },

    // 공부 상세보기를 누른 경우
    dtlViewFrame: {
        flex: 1,
        flexDirection: "column",
        zIndex: 11,
    },

    // 공부 상세보기 버튼을 누르지 않은 경우
    dtlViewNoFrame: {
        bottom: 0,
        marginTop: heightRelateSize(0, customHeight),
        zIndex: 11,
    },
    // 공부 모드 탭 영역
    stdyTabFrame: {
        marginTop: heightRelateSize(2),
        marginLeft: widthRelateSize(8),
        marginRight: widthRelateSize(8),
        borderRadius: 8,
        backgroundColor: "#212429",
    },
    stdDtlIcon: {
        width: widthRelateSize(20),
        height: heightRelateSize(20, customHeight),
        marginRight: widthRelateSize(20),
    },


    stdTabActiveViewFrame: {
        width: widthRelateSize(156),
        height: heightRelateSize(35, 704),
        marginLeft: widthRelateSize(6),
        marginRight: widthRelateSize(12),
        borderRadius: 8,
        marginTop: heightRelateSize(5),
        backgroundColor: "#2e3138",
        justifyContent: "center",
        alignItems: "center",

    },

    // 액티브 해제
    stdTabUnActiveViewFrame: {
        width: widthRelateSize(156),
        height: heightRelateSize(34, 704),
        marginTop: heightRelateSize(8, 704),
        marginBottom: heightRelateSize(6, 704),
        marginLeft: widthRelateSize(6),
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",

    },

    /**
     * 공부 상세 보기 영역
     */

    stdDtlViewFrame: {
        flex: 1,
        flexDirection: "column",
        width: widthRelateSize(360),
        height: heightRelateSize(125, customHeight),
        backgroundColor: "#2e3138",
    },

    tabViewFrame: {
        width: widthRelateSize(328),
        height: heightRelateSize(46, 704),
        marginTop: heightRelateSize(16, customHeight),
        marginLeft: widthRelateSize(16),
        marginRight: widthRelateSize(16),
        borderRadius: 8,
    },

    tabViewArea: {
        height: widthRelateSize(455, customHeight),
        marginLeft: widthRelateSize(6),
        marginRight: widthRelateSize(6),
        marginTop: heightRelateSize(6, customHeight),
        marginBottom: heightRelateSize(6, customHeight),
        borderRadius: 8,
        backgroundColor: "#212429"
    },

    // 공부 모드 탭 영역


    // 우리 학교 영역

    /**
     * 공부 상세 보기 영역
     */

    stdDtlViewFrame2: {
        flex: 1,
        flexDirection: "column",
        width: widthRelateSize(360),
        height: heightRelateSize(290),
        backgroundColor: "#2e3138",
    },


    sclTabActiveViewFrame: {
        width: widthRelateSize(156),
        height: heightRelateSize(35, 704),
        marginLeft: widthRelateSize(17),
        marginRight: widthRelateSize(12),
        borderRadius: 8,
        marginTop: heightRelateSize(5),
        backgroundColor: "#2e3138",
        justifyContent: "center",
        alignItems: "center",
    },

    // 우리 학교 영역 액티브 해제
    sclTabUnActiveViewFrame: {
        width: widthRelateSize(156),
        height: heightRelateSize(34, 704),
        marginTop: heightRelateSize(8, 704),
        marginBottom: heightRelateSize(6, 704),
        marginLeft: widthRelateSize(6),
        borderRadius: 8,
        justifyContent: "center",
        alignContent: "center",
    },

    activeTxt: {
        fontSize: fontRelateSize(15),
        textAlign: "center",
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#f0f1f2",
    },

    unActiveTxt: {
        marginBottom: heightRelateSize(6),
        textAlign: "center",
        fontSize: fontRelateSize(15),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        color: "#8b919e"
    },

    // Tab 관련 스타일
    stdTabViewArea: {
        height: heightRelateSize(455, customHeight),
        width: widthRelateSize(360),
        backgroundColor: "#2e3138"
    },

    area3: {
        flexDirection: 'column',
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "black",
        height: heightRelateSize(455, customHeight)
    },

    stdTabViewArea1: {
        flexDirection: "row",
        marginBottom: heightRelateSize(8),
    },


    stdTabViewFrame1: {
        width: widthRelateSize(164),
        height: heightRelateSize(78, customHeight),
        marginTop: heightRelateSize(20, customHeight),
        marginLeft: widthRelateSize(16),
    },
    stdTabViewTitle: {
        width: widthRelateSize(148),
        height: heightRelateSize(19, customHeight),
        marginLeft: widthRelateSize(8),
        marginTop: heightRelateSize(10, customHeight),
        // marginRight: widthRelateSize(10),
        marginBottom: heightRelateSize(12, customHeight),
        fontSize: fontRelateSize(14),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#8b919e",
    },
    stdDtlTxtUnActive: {
        width: widthRelateSize(296),
        height: heightRelateSize(22, customHeight),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(20),
        // marginTop: heightRelateSize(20, customHeight),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#f0f1f2",
    },


    stdTabViewTxt1: {
        width: widthRelateSize(148),
        height: heightRelateSize(20, customHeight),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(8),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(12, customHeight),
        marginBottom: heightRelateSize(16, customHeight),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2",

    },


    stdTabViewFrame2: {
        width: widthRelateSize(164),
        height: heightRelateSize(78, customHeight),
        marginTop: heightRelateSize(20, customHeight),
        marginRight: widthRelateSize(16),


    },

    stdTabViewTxt2: {
        width: widthRelateSize(148),
        height: heightRelateSize(19, customHeight),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(8),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(12, customHeight),
        marginBottom: heightRelateSize(16, customHeight),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2"
    },

    stdTabViewInline: {
        width: widthRelateSize(328),
        height: heightRelateSize(1, customHeight),
        marginLeft: widthRelateSize(16),
        marginTop: heightRelateSize(8, customHeight),
        marginBottom: heightRelateSize(8, customHeight),
        backgroundColor: "#383d45"
    },


    stdTabViewArea2: {
        flexDirection: "row",
        marginTop: heightRelateSize(8),
    },


    stdTabViewFrame3: {
        width: widthRelateSize(164),
        height: heightRelateSize(78),
        marginTop: heightRelateSize(8),
        marginLeft: widthRelateSize(16),
    },

    stdTabViewGroup3: {
        flex: 1,
        flexDirection: "row"


    },

    stdTabViewNumTxt3: {
        width: widthRelateSize(21),
        height: heightRelateSize(18),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(62),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(12),
        marginBottom: heightRelateSize(16),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "right",
        color: "#64a7ff"
    },

    stdTabViewNumTxtOff3: {
        width: widthRelateSize(29),
        height: heightRelateSize(18),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(64),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(12),
        marginBottom: heightRelateSize(16),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "right",
        color: "#64a7ff"
    },

    stdTabViewTxt3: {
        width: widthRelateSize(15),
        height: heightRelateSize(15),
        fontSize: fontRelateSize(12),
        marginLeft: widthRelateSize(4),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(16),
        marginBottom: heightRelateSize(16),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#6c7585",
    },


    stdTabViewFrame4: {
        width: widthRelateSize(164),
        height: heightRelateSize(78),
        marginTop: heightRelateSize(8),
    },

    stdTabViewTitle4: {
        width: widthRelateSize(90),
        height: heightRelateSize(17, customHeight),
        marginLeft: widthRelateSize(33),
        marginTop: heightRelateSize(10, customHeight),
        marginRight: widthRelateSize(4),
        marginBottom: heightRelateSize(12, customHeight),
        fontSize: fontRelateSize(14),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#8b919e",
    },

    stdTabViewStrssIcon: {
        width: widthRelateSize(14),
        height: heightRelateSize(14),
        marginTop: heightRelateSize(16),
        marginLeft: widthRelateSize(4),
    },

    stdTabViewNumTxt4: {
        width: widthRelateSize(21),
        height: heightRelateSize(18),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(62),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(12),
        marginBottom: heightRelateSize(16),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "right",
        color: "#ffa666"
    },
    stdTabViewNumTxtOff4: {
        width: widthRelateSize(29),
        height: heightRelateSize(18),
        fontSize: fontRelateSize(16),
        marginLeft: widthRelateSize(63),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(12),
        marginBottom: heightRelateSize(16),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "right",
        color: "#ffa666"
    },

    stdTabViewTxt4: {
        width: widthRelateSize(15),
        height: heightRelateSize(15),
        fontSize: fontRelateSize(12),
        marginLeft: widthRelateSize(4),
        marginRight: widthRelateSize(8),
        marginTop: heightRelateSize(16),
        marginBottom: heightRelateSize(16),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#6c7585",
    },

    peoplesFrame2: {
        flex: 1,
        flexDirection: "row",
        width: widthRelateSize(328),
        height: heightRelateSize(83),
        marginLeft: widthRelateSize(16),
        marginRight: widthRelateSize(16),
        marginBottom: heightRelateSize(69),
        borderRadius: 14,
        backgroundColor: "#383d45"
    },

    iconFrame2: {
        width: widthRelateSize(44),
        height: heightRelateSize(44),
        marginTop: heightRelateSize(19),
        marginLeft: widthRelateSize(20),
        marginBottom: heightRelateSize(20),
    },
    textFrame2: {
        width: widthRelateSize(228),
        height: heightRelateSize(51),
        fontSize: fontRelateSize(14),
        marginTop: heightRelateSize(16),
        marginLeft: widthRelateSize(16),
        marginRight: widthRelateSize(20),
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: heightRelateSize(26),
        letterSpacing: 0,
        textAlign: "left",
        color: "#aab0be",
    },


    /**
     * schoolDtlViewFrame
     */

    schlDtlViewFrame: {
        width: widthRelateSize(357),
        height: heightRelateSize(455),
        backgroundColor: "#2e3138",
        marginBottom: heightRelateSize(15)
    },
    /**
     * 우리학교 영역 -1 : 현재 공부중인 친구만 보기 / Switch
     */
    schlDtlViewArea1: {
        flexDirection: "row",
        marginTop: heightRelateSize(10),
        marginBottom: heightRelateSize(10),
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginRight: widthRelateSize(16),
    },
    shlDtlView1Txt: {
        width: widthRelateSize(141),
        height: heightRelateSize(16),
        marginRight: widthRelateSize(4),
        fontSize: fontRelateSize(13),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        justifyContent: "center",
        textAlign: "left",
        color: "#8b919e"
    },
    schlDtlView1Switch: {
        marginTop: heightRelateSize(3),
        transform: DeviceInfoUtil.getPlatformType() === 'ios' ? [{ scaleX: .7 }, { scaleY: .7 }] : [{ scaleX: .9 }, { scaleY: .9 }],
    },


    /**
     * 우리 학교 영역 -2 : 리스트가 존재하지 않을 경우
    */
    schlDtlViewNoFrame: {
        width: widthRelateSize(360),
        justifyContent: "center",
        alignItems: "center",
    },
    schlDtlViewNoIcon: {
        width: widthRelateSize(42),
        height: heightRelateSize(42),
        marginLeft: widthRelateSize(145),
        marginRight: widthRelateSize(159),
        marginTop: heightRelateSize(67),
        marginBottom: heightRelateSize(16),
    },
    schlDtlViewNoTxt: {
        width: widthRelateSize(328),
        height: heightRelateSize(16),
        fontSize: fontRelateSize(14),
        marginRight: widthRelateSize(16),
        marginBottom: heightRelateSize(185),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#8b919e"
    },

    /**
     * 우리학교 영역 -3 : 리스트
     */
    schlDtlViewArea2: {
        flexDirection: "row",
        flexWrap: 'wrap',
        width: widthRelateSize(DeviceInfoUtil.isIPad() ? 380 : 327),
        marginLeft: widthRelateSize(16),
        marginBottom: heightRelateSize(55)
    },

    schlDtlViewActiveItem1: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        width: widthRelateSize(109),
        height: heightRelateSize(150),
        borderRadius: 12,
        backgroundColor: "#2e3138",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#6491ff"
    },


    schlDtlViewUnActiveItem1: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        width: widthRelateSize(109),
        height: heightRelateSize(120),
        backgroundColor: "#2e3138",
    },
    schlDtlViewItemImg: {
        width: DeviceInfoUtil.isTablet() ? 79 : 69,
        height: DeviceInfoUtil.isTablet() ? 70 : 60,
        marginTop: heightRelateSize(2),
        marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? 37 : 17),
        marginRight: widthRelateSize(25),
        marginBottom: heightRelateSize(0),
    },

    schlDtlViewItemImgOffline: {
        width: DeviceInfoUtil.isTablet() ? 79 : 69,
        height: DeviceInfoUtil.isTablet() ? 70 : 60,
        marginTop: heightRelateSize(2),
        marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? 37 : 17),
        marginRight: widthRelateSize(25),
        marginBottom: heightRelateSize(0),
    },


    schlDtlViewItemNickName: {
        width: widthRelateSize(109),
        height: heightRelateSize(14),
        marginBottom: heightRelateSize(6),
        fontSize: fontRelateSize(12),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2"
    },

    schlDtlViewItemNickNameOffline: {
        width: widthRelateSize(109),
        height: heightRelateSize(14),
        marginBottom: heightRelateSize(6),
        fontSize: fontRelateSize(12),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#4e545e"
    },
    schlDtlViewItemToday: {
        width: widthRelateSize(109),
        height: heightRelateSize(15),

        marginBottom: heightRelateSize(4),
        fontSize: fontRelateSize(13),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#6491ff"
    },

    schlDtlViewItemTodayOffline: {
        width: widthRelateSize(109),
        height: heightRelateSize(15),

        marginBottom: heightRelateSize(4),
        fontSize: fontRelateSize(13),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#4e545e"
    },

    schlDtlViewItemWeek: {
        width: widthRelateSize(109),
        height: heightRelateSize(15),

        fontSize: fontRelateSize(13),
        marginBottom: heightRelateSize(10),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#8b919e"
    },

    schlDtlViewItemWeekOffline: {
        width: widthRelateSize(109),
        height: heightRelateSize(15),

        fontSize: fontRelateSize(13),
        marginBottom: heightRelateSize(10),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#8b919e"
    },

    schlDtlViewItemInline: {
        width: widthRelateSize(328),
        height: heightRelateSize(1),
        backgroundColor: "#383d45",
        marginBottom: heightRelateSize(17)
    },



    /**
     * 프로필 상세 영역
     */


    /**
     * 프로필 상세 영역 - 1 : 공통 영역
     */
    profileDtlFrame: {
        flexDirection: "column",
        width: widthRelateSize(304),
        height: heightRelateSize(530, customHeight),
        borderRadius: 20,
        backgroundColor: "#2e3138",
        marginTop: heightRelateSize(122, customHeight),
        marginLeft: widthRelateSize(28),
        marginRight: widthRelateSize(28),
        marginBottom: widthRelateSize(123, customHeight),
    },

    /**
    * 프로필 상세 영역 - 2 : 타이틀 영역
    */
    profileDtlTitleFrame: {
        flexDirection: "row",
        width: widthRelateSize(304),
        height: heightRelateSize(38),
    },
    profileDtlTitle: {
        width: widthRelateSize(200),
        height: heightRelateSize(22),

        fontSize: fontRelateSize(20),
        marginLeft: widthRelateSize(52),
        marginTop: heightRelateSize(20),
        marginRight: heightRelateSize(8),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2"
    },
    profileDtlCloseIconFrame: {
        width: widthRelateSize(26),
        height: heightRelateSize(26),
        marginTop: heightRelateSize(18),
    },
    profileDtlCloseIcon: {
        width: widthRelateSize(30),
        height: heightRelateSize(28),
    },

    /**
    * 프로필 상세 영역 - 2 : 이미지 및 사진 영역
    */
    profileBadgeFrame: {
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        height: heightRelateSize(80),
        marginTop: heightRelateSize(30, customHeight),
    },



    profileBadgeBackground: {
        width: widthRelateSize(90),
        height: heightRelateSize(80),
        backgroundColor: "#383d45",
        borderRadius: 45,
        justifyContent: "center",
        alignItems: "center"
        // backgroundColor: "red",
    },
    profileBadgeImage: {
        width: widthRelateSize(63),
        height: heightRelateSize(56),
    },
    profileNicknameFrame: {
        width: widthRelateSize(304),
        height: heightRelateSize(60),
    },
    profileNickname: {
        width: widthRelateSize(256),
        height: heightRelateSize(21),

        fontSize: fontRelateSize(18),
        marginTop: heightRelateSize(16, customHeight),
        marginLeft: widthRelateSize(24),
        marginRight: widthRelateSize(24),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be"
    },



    /**
     * 프로필 상세 영역 - 3 : 뱃지 영역
     */
    badgeFrame: {
        width: widthRelateSize(224),
        height: heightRelateSize(16, customHeight),

        fontSize: fontRelateSize(14),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be",
        marginTop: heightRelateSize(20, customHeight),
        marginLeft: widthRelateSize(20),
        marginRight: widthRelateSize(20),
        marginBottom: widthRelateSize(12, customHeight),
        borderRadius: 8,
        backgroundColor: "#383d45"
    },
    badgeCntFrame: {
        flex: 1,
        flexDirection: "row",
        marginTop: heightRelateSize(5, customHeight),
        marginLeft: widthRelateSize(36),
        marginRight: widthRelateSize(36),
        marginBottom: widthRelateSize(20),
    },
    badgeCnt: {
        width: widthRelateSize(224),
        height: heightRelateSize(16, customHeight),
        marginTop: heightRelateSize(20, customHeight),
        marginLeft: widthRelateSize(20),
        marginRight: widthRelateSize(20),
        marginBottom: widthRelateSize(16, customHeight),

        fontSize: fontRelateSize(14),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be"
    },

    badgeListFrame: {
        width: widthRelateSize(264),
        height: heightRelateSize(144, customHeight),
        marginLeft: widthRelateSize(20),
        marginRight: widthRelateSize(20),
        marginTop: heightRelateSize(20, customHeight),
        marginBottom: widthRelateSize(16),
        borderRadius: 8,
        backgroundColor: "#383d45"
    },

    badgeListItem: {
        width: widthRelateSize(64),
        height: heightRelateSize(72, customHeight),
    },

    badgeImg: {
        width: widthRelateSize(64),
        height: heightRelateSize(48, customHeight),
        marginBottom: heightRelateSize(8)
    },
    badgeContainCnt: {
        width: widthRelateSize(64),
        height: heightRelateSize(16, customHeight),

        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be"
    },

    todayRankingArea: {
        flexDirection: "column",
        width: widthRelateSize(264),
        height: heightRelateSize(134, customHeight),
        marginLeft: widthRelateSize(20),
        marginRight: widthRelateSize(20),
        marginBottom: heightRelateSize(15, customHeight),
        borderRadius: 8,
        backgroundColor: "#383d45"

    },

    monthRankingArea: {
        flexDirection: "column",
        width: widthRelateSize(264),
        height: heightRelateSize(134, customHeight),
        marginLeft: widthRelateSize(20),
        marginRight: widthRelateSize(20),
        borderRadius: 8,
        backgroundColor: "#383d45"

    },

    todayRainkingBestFrame: {
        flexDirection: "row",
        marginTop: heightRelateSize(12, customHeight),
        width: widthRelateSize(264),
        height: widthRelateSize(40, customHeight),
        marginLeft: widthRelateSize(85),
    },

    todayRankingTitle: {
        width: widthRelateSize(224),
        height: heightRelateSize(18, customHeight),

        fontSize: fontRelateSize(14),
        marginLeft: widthRelateSize(20),
        marginRight: widthRelateSize(20),
        marginTop: heightRelateSize(20, customHeight),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be"
    },

    rankingTitle: {
        width: widthRelateSize(224),
        height: heightRelateSize(18, customHeight),

        fontSize: fontRelateSize(14),
        marginLeft: widthRelateSize(20),
        marginRight: widthRelateSize(20),
        marginTop: heightRelateSize(20, customHeight),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be"
    },

    monthlyRainkingBestFrame: {
        flexDirection: "row",
        marginTop: heightRelateSize(12, customHeight),
        width: widthRelateSize(264),
        height: widthRelateSize(40, customHeight),
        marginLeft: widthRelateSize(85),
    },

    rankingBestIcon: {
        width: widthRelateSize(40),
        height: heightRelateSize(40),

    },
    rankingBestNumTxt: {
        height: heightRelateSize(28),

        fontSize: fontRelateSize(24),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "right",
        color: "#f0f1f2",
        marginLeft: widthRelateSize(10),
        marginTop: heightRelateSize(9, customHeight)
    },

    rankingBestTxt: {
        width: widthRelateSize(12),
        height: widthRelateSize(18),

        fontSize: fontRelateSize(14),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2",
        marginTop: heightRelateSize(18, customHeight),
        marginLeft: widthRelateSize(4)
    },

    nowTimeArea: {
        marginLeft: widthRelateSize(24),
        marginRight: widthRelateSize(24),
        marginTop: heightRelateSize(15, customHeight),
        flexDirection: "column",
    },

    nowTimeTxt: {
        width: widthRelateSize(216),
        height: widthRelateSize(17),
        fontSize: fontRelateSize(13),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#8b919e"
    },

    congCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: "center",
        textAlignVertical: 'center',
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    congStudyStopModalFrame: {
        width: widthRelateSize(304),
        height: heightRelateSize(299),
        borderRadius: 20,
        backgroundColor: "#ffffff",
        marginBottom: heightRelateSize(30)
    },
    congStudyStopModalTitleFrame: {
        width: widthRelateSize(256),
        height: heightRelateSize(106),
        marginBottom: heightRelateSize(10),
        flexDirection: "column"
    },
    congStduyStopModalIconFrame: {
        width: widthRelateSize(256),
        height: heightRelateSize(130),
        marginBottom: heightRelateSize(23),
        marginLeft: widthRelateSize(27),
        marginTop: heightRelateSize(24),

    },

    congStdybackgroundIcon: {
        width: widthRelateSize(256),
        height: heightRelateSize(130),
        position: "absolute",

    },

    congStdyStampIcon: {
        width: widthRelateSize(65),
        height: heightRelateSize(23),
        marginLeft: widthRelateSize(95),
        marginTop: heightRelateSize(85),
        position: "absolute",
    },
    congStduyStopModalIcon: {
        width: widthRelateSize(107.6),
        height: heightRelateSize(100),
        marginLeft: widthRelateSize(100),
        marginTop: heightRelateSize(10),
    },
    congStdyMissionTxt: {
        width: widthRelateSize(256),
        height: heightRelateSize(21),

        fontSize: fontRelateSize(18),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        marginTop: heightRelateSize(8),
        color: "#3f4855"
    },

    congModalContentFrame: {
        width: widthRelateSize(256),
        height: heightRelateSize(44),
        marginLeft: widthRelateSize(24),
    },

    congModalContentTxt: {
        width: widthRelateSize(256),
        height: heightRelateSize(44),

        fontSize: fontRelateSize(14),
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: 22,
        letterSpacing: 0,
        color: "#616d82",
        textAlign: "center",
    },
    congModalMoveTxt: {
        color: "#ff886e"
    },
    congModalBtnFrame: {
        width: widthRelateSize(256),
        height: heightRelateSize(64),
        borderRadius: fontRelateSize(12),
        marginLeft: widthRelateSize(24),
    },
    congModalBtnTxt: {
        width: widthRelateSize(256),
        height: heightRelateSize(16),

        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#6491ff",
        marginTop: heightRelateSize(8),

    },
    congModalBtn: {
        width: widthRelateSize(256),
        height: heightRelateSize(64),
        marginTop: heightRelateSize(23),
    },

    stdEndFrame: {
        width: widthRelateSize(304),
        height: heightRelateSize(194),
        borderRadius: 20,
        backgroundColor: "#ffffff",
    },

    stdEndTitleFrame: {
        width: widthRelateSize(256),
        height: heightRelateSize(106),
        marginBottom: heightRelateSize(10),
        flexDirection: "column"
    },
    stdEndModalImg: {
        width: DeviceInfoUtil.isTablet() ? 58 : 48,
        height: DeviceInfoUtil.isTablet() ? 58 : 48,
        marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? 113 : 103),
        marginRight: widthRelateSize(105),
        marginBottom: heightRelateSize(16),
    },
    stdEndModalContent: {
        width: widthRelateSize(256),
        height: heightRelateSize(86),
        marginTop: heightRelateSize(32),
        marginLeft: widthRelateSize(20),
        flexDirection: "column"
    },
    stdEndModalTitle: {
        width: widthRelateSize(256),
        height: heightRelateSize(32),
        fontSize: fontRelateSize(14),
        marginTop: heightRelateSize(5),
        marginBottom: heightRelateSize(3),
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        lineHeight: heightRelateSize(22),
        letterSpacing: 0,
        color: "#616d82",
    },

    stdEndModalBtnFrame: {
        flexDirection: "row",
        width: widthRelateSize(256),
        height: heightRelateSize(64),
        borderRadius: fontRelateSize(12),
        marginLeft: widthRelateSize(24),

    },
    stdEndModalLeftBtn: {
        width: widthRelateSize(120),
        height: heightRelateSize(64),
        marginTop: heightRelateSize(23),
    },

    stdEndModalLeftBtnTxt: {
        width: widthRelateSize(120),
        height: heightRelateSize(16),

        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#6491ff",
        marginTop: heightRelateSize(8),

    },
    stdEndModalRightBtn: {
        width: widthRelateSize(120),
        height: heightRelateSize(64),
        marginTop: heightRelateSize(23),
        marginLeft: widthRelateSize(15),
    },

    stdEndModalRightTxt: {
        width: widthRelateSize(120),
        height: heightRelateSize(16),

        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#6491ff",
        marginTop: heightRelateSize(8),
    },

});
export default styles;