import serial.tools.list_ports
from serial import Serial
import keyboard
import time

# USB 시리얼 포트 설정 (아두이노 연결 포트)
SERIAL_PORT = 'COM3'  # 실제 포트로 변경 (Windows: COM3, Linux: /dev/ttyACM0, Mac: /dev/cu.usbmodem*)
BAUD_RATE = 115200

def process_command(command):
    """시리얼 명령 처리 - 실제 키보드 입력처럼"""
    command = command.strip()
    
    if command.startswith("HIT:"):
        # HIT:D:150000 형식에서 키만 추출
        parts = command.split(":")
        if len(parts) >= 2:
            key = parts[1].strip().lower()
            keyboard.press(key)
    
    elif command.startswith("RELEASE:"):
        # RELEASE:D 형식
        key = command.split(":")[1].strip().lower()
        keyboard.release(key)

def main():
    print("=== Drum Pad USB Keyboard Input ===")
    print(f"Connecting to {SERIAL_PORT}...")
    
    try:
        ser = Serial(SERIAL_PORT, BAUD_RATE, timeout=0.01)
        time.sleep(2)
        print("✓ Connected! Press Ctrl+C to exit.\n")
        
        buffer = ""
        
        while True:
            if ser.in_waiting > 0:
                data = ser.read(ser.in_waiting).decode('utf-8', errors='ignore')
                buffer += data
                
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    if line.strip():
                        process_command(line)
            
            time.sleep(0.001)
    
    except Exception as e:
        print(f"✗ Error: {e}")
        print("\n포트 확인:")
        print("  Windows: 장치 관리자 > 포트(COM & LPT) 또는 아두이노 IDE")
        print("  Linux: ls /dev/ttyACM* 또는 /dev/ttyUSB*")
        print("  Mac: ls /dev/cu.usbmodem* 또는 /dev/cu.usbserial*")
        print("\n사용 가능한 포트:")
        ports = serial.tools.list_ports.comports()
        for port in ports:
            print(f"  - {port.device}: {port.description}")
    
    except KeyboardInterrupt:
        print("\n\n✓ Stopped.")
    
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()

if __name__ == "__main__":
    # 필요한 라이브러리 확인
    try:
        from serial import Serial
        import serial.tools.list_ports
        import keyboard
    except ImportError:
        print("설치 필요:")
        print("  pip uninstall serial")
        print("  pip install pyserial keyboard")
        exit(1)
    
    main()