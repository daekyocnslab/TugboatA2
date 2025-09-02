import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';

const ConfirmationModal = ({ visible, onCancel, onConfirm, input }) => (
    <Modal animationType="fade" transparent={true} visible={visible}>
        <View style={styles.centeredView}>
            <View style={styles.modalView}>
                <Text style={styles.modalTitle}>{`"${input}" 회원님`}</Text>
                <Text style={styles.modalMessage}>반갑습니다!</Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelText}>앗! 제가 아니에요!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                        <Text style={styles.confirmText}>확인</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        padding: 10,
        borderWidth: 1,
        borderRadius: 5,
        borderColor: '#ccc',
    },
    cancelText: {
        color: '#333',
    },
    confirmButton: {
        padding: 10,
        backgroundColor: '#2196F3',
        borderRadius: 5,
    },
    confirmText: {
        color: '#FFF',
    },
});

export default ConfirmationModal;