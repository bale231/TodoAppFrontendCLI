import React, {ReactNode, useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {BlurView} from '@react-native-community/blur';
import {useTheme} from '../context/ThemeContext';

interface SwipeableListItemProps {
  children: ReactNode;
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}

const ACTION_WIDTH = 60;
const BUTTON_WIDTH = 100;

export default function SwipeableListItem({
  children,
  label,
  onEdit,
  onDelete,
}: SwipeableListItemProps) {
  const {theme} = useTheme();
  const isDark = theme === 'dark';
  const [showConfirm, setShowConfirm] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Animate modal
  useEffect(() => {
    if (showConfirm) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.8);
      modalOpacity.setValue(0);
    }
  }, [showConfirm]);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const {translationX} = event.nativeEvent;
    const clamped = Math.max(
      -ACTION_WIDTH * 1.2,
      Math.min(ACTION_WIDTH * 1.2, translationX),
    );
    translateX.setValue(clamped);
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === 5) {
      // END state
      const {translationX} = event.nativeEvent;
      const target =
        translationX < -ACTION_WIDTH
          ? -ACTION_WIDTH
          : translationX > ACTION_WIDTH
          ? ACTION_WIDTH
          : 0;

      Animated.spring(translateX, {
        toValue: target,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Left action - EDIT */}
        <View style={[styles.actionLeft, {width: BUTTON_WIDTH}]}>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.actionButton}>
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Right action - DELETE */}
        <View style={[styles.actionRight, {width: BUTTON_WIDTH}]}>
          <TouchableOpacity
            onPress={() => setShowConfirm(true)}
            style={styles.actionButton}>
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}>
          <Animated.View
            style={[
              styles.content,
              isDark && styles.contentDark,
              {transform: [{translateX}]},
            ]}>
            {children}
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="none"
        onRequestClose={() => setShowConfirm(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowConfirm(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <BlurView
              style={styles.blurView}
              blurType={isDark ? 'dark' : 'light'}
              blurAmount={10}
              reducedTransparencyFallbackColor={
                isDark ? '#1a1a1a' : '#ffffff'
              }>
              <Animated.View
                style={[
                  styles.modalContent,
                  isDark && styles.modalContentDark,
                  {
                    transform: [{scale: modalScale}],
                    opacity: modalOpacity,
                  },
                ]}>
                <Text
                  style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  Elimina Lista
                </Text>
                <Text style={[styles.modalText, isDark && styles.modalTextDark]}>
                  Sei sicuro di voler eliminare "
                  <Text style={styles.modalBold}>{label}</Text>"?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => setShowConfirm(false)}
                    style={[
                      styles.modalButton,
                      styles.cancelButton,
                      isDark && styles.cancelButtonDark,
                    ]}>
                    <Text
                      style={[
                        styles.buttonText,
                        isDark && styles.buttonTextDark,
                      ]}>
                      Annulla
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      onDelete();
                      setShowConfirm(false);
                    }}
                    style={[styles.modalButton, styles.deleteButton]}>
                    <Text style={styles.deleteButtonText}>Elimina</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </BlurView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    marginVertical: 4,
  },
  actionLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
    borderRadius: 12,
  },
  actionRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 12,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    zIndex: 10,
  },
  contentDark: {
    backgroundColor: '#1f2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  blurView: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalContentDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1f2937',
  },
  modalTitleDark: {
    color: '#fff',
  },
  modalText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
  },
  modalTextDark: {
    color: '#d1d5db',
  },
  modalBold: {
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
  },
  cancelButtonDark: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  buttonTextDark: {
    color: '#d1d5db',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
