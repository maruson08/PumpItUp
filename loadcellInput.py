import serial
import keyboard
import time

BT_PORT = 'COM10'  # 실제 포트로 변경
BAUD_RATE = 115200

def process_command(command):
    command = command.strip()
    
    if command.startswith("HIT:"):
        parts = command.split(":")
        if len(parts) >= 2:
            key = parts[1].strip().lower()
            keyboard.press(key)
    
    elif command.startswith("RELEASE:"):
        # RELEASE:D 형식
        key = command.split(":")[1].strip().lower()
        keyboard.release(key)

def main():
    print(f"Connecting to {BT_PORT}...")
    
    try:
        ser = serial.Serial(BT_PORT, BAUD_RATE, timeout=0.01)
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
    
    except serial.SerialException as e:
        print(f"✗ Error: {e}")
        print("\n포트 확인:")
        print("  Windows: 장치 관리자 > 포트(COM & LPT)")
        print("  Linux: ls /dev/rfcomm* 또는 /dev/ttyUSB*")
    
    except KeyboardInterrupt:
        print("\n\n✓ Stopped.")
    
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()

if __name__ == "__main__":
    try:
        import serial
        import keyboard
    except ImportError:
        print("설치 필요: pip install pyserial keyboard")
        exit(1)
    
    main()