import React, { lazy, MutableRefObject, Suspense, useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react-native';

import ApplicationNavigator from './navigation/ApplicationNavigator';
import { Store, persistor } from './modules/redux/Stroe';
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import TbStdyDoDtlModules from './modules/sqlite/TbStdyDoDtlModules';
import { AppState, AppStateStatus, Button, LogBox } from 'react-native';
import { activateKeepAwakeAsync } from "expo-keep-awake";


// 운영모드에서만 Sentry가 수행됩니다.
if (process.env.REACT_NATIVE_APP_MODE === "prd") {
// Sentry Logger 설치
Sentry.init({
		dsn: process.env.SENTRY_DSN,

		// 트랜잭션 추적
		tracesSampleRate: 1.0,

		// 프로파일링 (CPU, 메서드 성능 등)
		_experiments: {
			profilesSampleRate: 1.0,
			replaysSessionSampleRate: 1.0,
			replaysOnErrorSampleRate: 1.0,
		},
		// 세션 크래시율 계산을 위한 세션 추적
		enableAutoSessionTracking: true,
		// 사용자 비활성 후 세션 종료까지 대기 시간
		sessionTrackingIntervalMillis: 10000,

		// ANR 및 Native Crash 감지
		enableNative: true,															// Native SDK 활성화 (기본 true)
		enableNativeCrashHandling: true,  // Native Crash (Java/Kotlin/Swift) 감지
		enableNdkScopeSync: true, 							// NDK 크래시 시 JS 컨텍스트 함께 로깅

		// Performance/Replay 추적에 사용될 통합
		integrations: [
			//navigation + 네트워크 등 트랜잭션 추적 통합
			Sentry.reactNativeTracingIntegration(),
			//화면 녹화 리플레이 통합
			// Sentry.mobileReplayIntegration(),
		],
	});
}

/**
 * Init App
 */
const App = () => {

  // 사용자의 앱 상태 ('active' | 'background' | 'inactive' | 'unknown' | 'extension)
  const appState: MutableRefObject<AppStateStatus> = useRef(AppState.currentState);

  useEffect(() => {

    LogBox.ignoreAllLogs(); // 로그박스 끄기
    // [STEP3] 앱의 자동꺼짐을 방지하기 위해 추가함.
    activateKeepAwakeAsync();
    // [STEP4] SQLite : 앱 실행 시 내부 데이터베이스의 존재를 확인하여 데이터베이스를 생성합니다.
    TbStdyDoDtlModules.createTable();
  }, []);


  return (
    // Redux-Store
    <Provider store={Store}>
      {/* Redux-Persist */}
      <PersistGate loading={null} persistor={persistor}>
        <ApplicationNavigator />
      </PersistGate>
    </Provider>
  )
}
export default Sentry.wrap(App);
