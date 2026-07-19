import re
import csv
from collections import defaultdict

def main():
    with open("src/rawGradesCsv.ts", "r", encoding="utf-8") as f:
        content = f.read()
    
    match = re.search(r'`([^`]+)`', content)
    if not match:
        print("CSV content not found inside rawGradesCsv.ts!")
        return
    
    csv_str = match.group(1).strip()
    
    lines = []
    for line in csv_str.split('\n'):
        line = line.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split(',')]
        if len(parts) > 1 and parts[-1] == '':
            parts = parts[:-1]
        lines.append(parts)
        
    headers = lines[0]
    rows = lines[1:]
    
    print("CSV parsed. Total rows:", len(rows))
    
    # We will accumulate grades by student name + id (or class/num)
    # The columns are: 반, 번호, 이름, 학년, 학기, 교과, 과목, 이수단위, 석차등급
    # Let's map each column
    col_idx = {name: i for i, name in enumerate(headers)}
    
    students_data = defaultdict(lambda: defaultdict(list)) # student_key -> sem_key -> list of grades
    
    for row in rows:
        ban = row[col_idx['반']]
        no = row[col_idx['번호']]
        name = row[col_idx['이름']]
        grade = int(row[col_idx['학년']])
        sem = int(row[col_idx['학기']])
        subject = row[col_idx['과목']]
        unit = int(row[col_idx['이수단위']])
        rank = int(row[col_idx['석차등급']])
        
        student_id = f"3{ban}{str(no).zfill(2)}"
        sem_key = f"{grade}-{sem}"
        
        students_data[student_id][sem_key].append({
            'subject': subject,
            'unit': unit,
            'rank': rank
        })

    # Let's print out 3101's details
    print("\n--- 3101 GPAs (Standard Calculation) ---")
    s_id = '3101'
    if s_id in students_data:
        all_units = 0
        all_weighted = 0
        for sem in sorted(students_data[s_id].keys()):
            sem_units = 0
            sem_weighted = 0
            for item in students_data[s_id][sem]:
                sem_units += item['unit']
                sem_weighted += item['unit'] * item['rank']
            all_units += sem_units
            all_weighted += sem_weighted
            sem_gpa = sem_weighted / sem_units if sem_units > 0 else 0
            print(f"Semester {sem}: GPA = {sem_gpa:.4f} (Units = {sem_units}, Weighted = {sem_weighted})")
            for item in students_data[s_id][sem]:
                print(f"  {item['subject']}: Unit={item['unit']}, Rank={item['rank']}")
        overall_gpa = all_weighted / all_units if all_units > 0 else 0
        print(f"Overall GPA: {overall_gpa:.4f}")
    else:
        print("Student 3101 not found.")

if __name__ == "__main__":
    main()
