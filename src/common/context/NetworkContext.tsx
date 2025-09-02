// NetworkContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// 1. createContext를 사용하여 네트워크 상태 관리를 위한 컨텍스트를 만듭니다.
const NetworkContext = createContext({
    isNetworkCheckEnabled: true,                        // 네트워크 상태 연결 여부 
    setNetworkCheckEnabled: (enabled: boolean) => { }   // 네트워크 상태 연결 상태 변경
});

/**
 * 2. 네트워크 상태를 관리하고, 하위 컴포넌트에 상태와 상태 변경 함수를 제공합니다.
 * @param param0 
 * @returns 
 */
export const NetworkProvider = ({ children }: { children: any }) => {

    const [isNetworkCheckEnabled, setNetworkCheckEnabled] = useState(true);     // 네트워크 연결 상태 체크 여부 

    /**
     * 3. NetInfo.addEventListener를 등록하고, 네트워크 연결이 끊어졌을 때 알림을 표시합니다.
     * - isNetworkCheckEnabled 상태를 통해서 
     */
    useEffect(() => {
        let unsubscribe: NetInfoSubscription | null = null;
        if (isNetworkCheckEnabled) {
            // 리스너를 등록합니다.
            unsubscribe = NetInfo.addEventListener(state => {
                // 네트워크 연결이 되지 않았을 경우 Alert을 출력합니다.
                if (!state.isConnected) {
                    Alert.alert("네트워크 연결이 끊겼습니다.", "디바이스 연결 상태를 확인해주세요.");
                }
            });
        }
        return () => {
            // 리스너 clean-up
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isNetworkCheckEnabled]);

    return (
        <NetworkContext.Provider value={{ isNetworkCheckEnabled, setNetworkCheckEnabled }}>
            {children}
        </NetworkContext.Provider>
    )
}

// 4. 이 훅을 통해 다른 컴포넌트에서 NetworkContext를 쉽게 사용할 수 있습니다.
export const useNetwork = () => useContext(NetworkContext);