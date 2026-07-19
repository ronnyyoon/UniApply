import re

def main():
    with open("src/rawGradesCsv.ts", "r", encoding="utf-8") as f:
        content = f.read()
    
    match = re.search(r'`([^`]+)`', content)
    if not match:
        print("CSV content not found inside rawGradesCsv.ts!")
        return
    
    csv_str = match.group(1).strip()
    lines = csv_str.split('\n')
    
    print("Total lines:", len(lines))
    
    headers = [h.strip() for h in lines[0].split(',')]
    print("Headers:", headers)
    
    anomalies = 0
    for idx, line in enumerate(lines[1:], start=2):
        parts = [p.strip() for p in line.split(',')]
        # Drop the trailing empty part if any
        if len(parts) > 1 and parts[-1] == '':
            parts = parts[:-1]
            
        if len(parts) != 9:
            print(f"Row {idx} (Line {idx}): expected 9 columns, got {len(parts)}. Content: {line}")
            anomalies += 1
            if anomalies > 10:
                print("Too many anomalies, stopping...")
                break

    if anomalies == 0:
        print("No column anomalies found in CSV lines.")

if __name__ == "__main__":
    main()
