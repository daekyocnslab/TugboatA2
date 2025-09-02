import { createStackNavigator } from "@react-navigation/stack";

import { Paths } from "./conf/Paths";
import Home from "../screens/Home";
import FaceLogin from "../screens/login/FaceLogin.tsx";
import TouchScreen from "../screens/login/TouchScreen.tsx";
import LoginSelectScreen from "../screens/login/LoginSelectScreen.tsx";
import AttendanceScreen from "../screens/attendance/AttendanceScreen.tsx";
import CenterInputScreen from "../screens/attendance/CenterInputScreen.tsx";
import StudyReportScreen from "../screens/study/StudyReportScreen.tsx";
import StudyMeditationScreen from "../screens/study/StudyMeditationScreen.tsx";
import StudyPlanScreen from "../screens/study/StudyPlanScreen.tsx";

import { useSelector } from "react-redux";
import { RootState } from "../modules/redux/RootReducer.ts";
import VisionCameraTakePicktureScreen from "@/screens/research/VisionCameraTakePicktureScreen.tsx";
import StudyScreen from "@/screens/study/StudyScreen.tsx";

/**
 * Stack Navigator : 일반적인 화면만 출력을 하는 경우
 * @returns
 */
const StackNavigator = () => {
  const Stack = createStackNavigator(); // Stack Navigator 이름을 정의합니다.
  const userState = useSelector((state: RootState) => state.userInfo); // Redux 저장소에서 데이터를 조회해옵니다.

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: '#f9f9f9',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#2c3e50',
        },
      }}
      initialRouteName={
        userState.groups && userState.groups['grpSq'] != 0 && userState.groups['grpNm'] != '' ? Paths.LOGIN_SELECT : Paths.CENTER_INPUT
      }
      // initialRouteName={Paths.HOME}
      detachInactiveScreens={true}
    >

      <Stack.Screen
        name={Paths.HOME}
        component={Home}
        options={({ navigation }) => ({
          headerShown: true,
          title: '홈',
          headerLeft: () => (<></>)
        })}
      />
      {/* <Stack.Screen
        name={Paths.STUDY}
        component={StudyScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: '학습',
          headerLeft: () => (<></>)
        })}
      /> */}
      <Stack.Screen
        name={Paths.TEMP_STUDY}
        component={VisionCameraTakePicktureScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: '임시 학습',
          headerLeft: () => (<></>)
        })}
      />

      <Stack.Screen
        name={Paths.FACE}
        component={FaceLogin}
        options={({ navigation }) => ({
          headerShown: false,
          title: '얼굴 로그인',
          headerLeft: () => (<></>)
        })}
      />

      <Stack.Screen
        name={Paths.TOUCH}
        component={TouchScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '터치 대기 화면',
          headerLeft: () => (<></>)
        })}
      />

      <Stack.Screen
        name={Paths.LOGIN_SELECT}
        component={LoginSelectScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '로그인 선택',
          headerLeft: () => (<></>)
        })}
      />

      <Stack.Screen
        name={Paths.CENTER_INPUT}
        component={CenterInputScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '센터 코드 입력',
          headerLeft: () => (<></>)
        })}
      />

      <Stack.Screen
        name={Paths.ATTENDANCE}
        component={AttendanceScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '출결 번호 입력',
          headerLeft: () => (<></>)
        })}
      />
      <Stack.Screen
        name={Paths.STUDY}
        component={StudyScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '공부 화면',
          headerLeft: () => (<></>)
        })}
      />
      <Stack.Screen
        name={Paths.REPORT}
        component={StudyReportScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '레포트 화면',
          headerLeft: () => (<></>)
        })}
      />
      <Stack.Screen
        name={Paths.MEDITATION}
        component={StudyMeditationScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '명상 화면',
          headerLeft: () => (<></>)
        })}
      />
      <Stack.Screen
        name={Paths.STUDY_PLAN}
        component={StudyPlanScreen}
        options={({ navigation }) => ({
          headerShown: false,
          title: '학습 계획',
          headerLeft: () => (<></>)
        })}
      />


    </Stack.Navigator>
  );
};
export default StackNavigator;
