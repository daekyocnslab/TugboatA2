import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CustomModal = ({
                         visible,
                         onClose,
                         title,
                         message,
                         confirmText = '확인',
                         cancelText,
                         onConfirm,
                         onCancel
                     }) => {
    return (
        <Modal animationType="fade" transparent={true} visible={visible}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {/* 제목 및 메시지 */}
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>

                    {/* 버튼 영역 */}
                    <View style={styles.buttonContainer}>
                        {cancelText && (
                            <TouchableOpacity style={styles.cancelButton}  onPress={() => {
                                onCancel();  // ✅ 직접 호출하는 것이 아니라 함수 형태로 실행되었는지 확인
                            }}>
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.confirmButton}  onPress={() => {
                            onConfirm();  // ✅ 직접 호출하는 것이 아니라 함수 형태로 실행되었는지 확인
                        }}>
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 닫기 버튼 */}
                    {/*<TouchableOpacity style={styles.closeButton} onPress={onClose}>*/}
                    {/*    <Text style={styles.closeText}>X</Text>*/}
                    {/*</TouchableOpacity>*/}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: 400,
        padding: 24,
        backgroundColor: 'hsl(220, 20%, 62%)',  // 채도를 20%로 조정
        borderColor: 'hsl(220, 100%, 62%)',
        borderWidth:1,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 18,
        textAlign: 'center',
        color: '#333',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#333',
        paddingVertical: 15,
        borderRadius: 25,
        marginRight: 5,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#4a90e2',
        paddingVertical: 15,
        borderRadius: 25,
        marginLeft: 5,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    closeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default CustomModal;