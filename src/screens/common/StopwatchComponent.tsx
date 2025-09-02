import { Platform, Text, View } from "react-native"
import styles from './styles/StopwatchComponentStyle'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { time } from "@tensorflow/tfjs-core";

/**
 * 화면상에 보여지는 스탑워치가 출력되는 컴포넌트
 * @param {boolean} isFaceDtctYn 얼굴이 존재하는지 여부 반환
 * @param  {number} initTime 이어하기 시간 반환
 * @returns 
 */
export const StopwatchComponent = forwardRef(({ isFaceDtctYn, initTime = 0 }: { isFaceDtctYn: boolean, initTime?: number }, ref) => {

    const [isRunning, setIsRunning] = useState(false);          // 타이머 실행 여부 

    const animationFrameId = useRef(0);                         // 루프 아이디
    const startTmRef = useRef<number>(0);                       // 스탑워치 시작 시간
    const stopTmRef = useRef<number>(initTime * 1000);          // 이어하기 시간 or 멈춘 시간

    // 타이머 시간
    const displayTmAllRef = useRef(0);                          // 타이머에 출력되는 시간(초)
    const displayTmRef = useRef("00:00");                       // 타이머 (시간/분)
    const displayTmSecRef = useRef("00");                       // 타이머 (초)

    const [isStop, setIsStop] = useState(false);                // 종료했는지 여부 

    /**
     * 부모 컴포넌트로 전달할 값 정의
     */
    useImperativeHandle(ref, () => ({
        start: stopwatchHandler.start,          // 스탑워치를 시작합니다.
        pause: stopwatchHandler.pause,            // 스탑워치를 멈춥니다.
        stop: stopwatchHandler.stop,            // 스탑워치를 멈춥니다.
        reset: stopwatchHandler.reset,          // 스탑워치를 초기화합니다.
        restart: stopwatchHandler.restart,      // 스탑워치를 재시작합니다.(이어하기)
        getNowSec: timeHandler.getNowSec,       // 현재 타이머 시간을 가져옵니다.
    }));


    useEffect(() => {

        /**
         * 매번 루프가 돌면서 최신 시간을 갱신합니다.
         */
        const updateDisplayTm = () => {
            const currentDt = Date.now();                                           // 현재 시간

            // 현재 시간 - 시작시간 + 일시정지에 대한 누적시간을 더합니다.
            const displayTm = !isStop ? currentDt - startTmRef.current + stopTmRef.current : stopTmRef.current
            const { formatTime, convertMilSecToSec } = timeHandler

            displayTmRef.current = formatTime(displayTm, false)                     // [화면] 시간 갱신
            displayTmSecRef.current = formatTime(displayTm, true)                   // [화면] 초 갱신
            displayTmAllRef.current = convertMilSecToSec(displayTm);                // 파라미터로 넘겨줄 값을 갱신
            animationFrameId.current = requestAnimationFrame(updateDisplayTm);      // currentDisplayTm() 함수 반복 수행
        }

        // [CASE1-1] 스탑워치가 실행중인 경우  : updateDisplayTm 함수를 호출합니다.
        if (isRunning) {
            startTmRef.current = Date.now();
            animationFrameId.current = requestAnimationFrame(updateDisplayTm);      // 애니메이션 시작 : 해당 부분에서 반복적으로 수행
        }

        // [CASE1-2] 스탑워치가 종료된 경우 
        else {
            cancelAnimationFrame(animationFrameId.current);     // 중지 시 기존 ID 취소
            animationFrameId.current = 0;                       // ID 초기화
        }
        // clean-up
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [isRunning]);




    /**
     * 스탑워치의 동작을 관리합니다.
     */
    const stopwatchHandler = (() => {
        return {

            /**
             * 스탑워치를 시작합니다.
             */
            start: (): void => {
                setIsRunning(true);                     // 스탑워치 수행 여부를 변경
                startTmRef.current = Date.now();        // 시작시간을 기록
                console.log("[+] 스탑워치 시작시간 : ", timeHandler.formatTime(startTmRef.current, true));
            },
            /**
             * 스탑워치를 일시정지를 합니다.
             */
            pause: (): void => {
                setIsRunning(false);                                        // 스탑워치 수행 여부를 변경
                cancelAnimationFrame(animationFrameId.current);             // 애니메이션 중단
                animationFrameId.current = 0;                               // ID 초기화
                stopTmRef.current += (Date.now() - startTmRef.current);     // 종료시간을 기록합니다.(누적된 시간 축적)
                console.log("[+] 스탑워치 일시정지 : ", timeHandler.formatTime(stopTmRef.current, true));
            },

            /**
             * 스탑워치를 종료합니다.
             */
            stop: (): void => {
                setIsStop(true);                                            // 종료함을 선택
                stopTmRef.current += (Date.now() - startTmRef.current);     // 종료시간을 기록합니다.
                console.log("[+] 스탑워치 종료 : ", timeHandler.formatTime(stopTmRef.current, true));
            },

            /**
            * 스탑워치를 다시 시작합니다. 일시정지된 시간부터 계속됩니다.
            */
            restart: (): void => {
                if (!isRunning) {
                    // 이전에 기록된 시간을 유지한 채로 다시 시작
                    setIsRunning(true);                 // 스탑워치 수행 여부를 변경

                    if (Platform.OS === "ios") {
                        // stopTmRef.current += (Date.now() - startTmRef.current);     // 종료시간을 기록합니다.(누적된 시간 축적)
                    }
                    console.log("[+] 스탑워치 재시작 시간 : ", timeHandler.formatTime(startTmRef.current, true));
                }
            },

            /**
            * 스탑워치를 초기화 합니다.
            */
            reset: () => {
                console.log("[+] stopwatchHandler reset Call")
                setIsRunning(false);                                // 스탑워치 수행 여부를 변경
                stopTmRef.current = initTime;                       // 리셋 시에도 초기 시간으로 설정
                cancelAnimationFrame(animationFrameId.current);     // 리셋 시 애니메이션 중단
                displayTmRef.current = "00:00"                      // "시간, 분" 초기화 
                displayTmSecRef.current = "00"                      // "초" 초기화 
                animationFrameId.current = 0;                       // ID 초기화
            },

        }

    })();


    /**
     * 시간을 관리합니다 : formatting
     */
    const timeHandler = (() => {
        return {
            /**
             * 시간/분과 초를 계산하는 함수 
             * @param {number} milliseconds 
             * @param {boolean} isSec 
             * @returns {string} 
             */
            formatTime: (milliseconds: number, isSec: boolean): string => {
                const totalSeconds = Math.floor(milliseconds / 1000);
                const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
                const seconds = String(totalSeconds % 60).padStart(2, '0');
                return !isSec ? `${hours}:${minutes}` : seconds;
            },

            /**
             * 밀리세컨드를 초로 반환해주는 함수 
             * @param {number} milliseconds 
             * @returns {number}
             */
            convertMilSecToSec: (milliseconds: number): number => {
                return Math.floor(milliseconds / 1000);
            },

            /**
             * 함수 호출 시점의 총 시간(초)를 반환합니다.
             * @returns {number} 
             */
            getNowSec: (): number => displayTmAllRef.current,

            /**
             * 멈췄을때의 시간을 반환합니다.
             */
            getStopTm: (): number => {
                console.log("[+] getStopTm :: ")

                // 실행중인 경우 
                if (isRunning) {
                    const now = Date.now();
                    const elapsedTime = now - startTmRef.current + stopTmRef.current;
                    console.log("startTmRef :: ", startTmRef)
                    console.log("stopTmRef :: ", stopTmRef)
                    console.log("elapsedTime :: ", elapsedTime)

                    return Math.floor(elapsedTime / 1000); // 실행 중일 때는 실시간 경과 시간 반환
                }
                return Math.floor(stopTmRef.current / 1000); // 정지 중일 때는 누적된 시간 반환
            },

        }
    })();


    // ============================================================================================================================================================
    return (
        <View style={styles.timerFrame}>
            {/* 스탑워치 데이터 영역  */}
            <View style={styles.stopwatchHourFrame}>
                <Text style={styles.stopwatchHour}>{displayTmRef.current}</Text>
            </View>

            {/* 얼굴 인식 여부 및 초 데이터 영역 */}
            <View style={styles.stopwatchSecArea}>
                {/* 얼굴이 잘 측정되고 있는지 표시 */}
                <View style={styles.faceFrame}>
                    <View style={isFaceDtctYn ? styles.findFace : styles.notFindFace}></View>
                </View>

                {/* 스탑워치 초 데이터 */}
                <View style={styles.stopwatchSecFrame}>
                    <Text style={styles.stopwatchSec}>{displayTmSecRef.current}</Text>
                </View>
            </View>
        </View>

    )
});