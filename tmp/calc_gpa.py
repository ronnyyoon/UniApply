import re
import pandas as pd
import io

def main():
    # Read src/rawGradesCsv.ts and extract the multi-line CSV string
    with open("src/rawGradesCsv.ts", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract content inside backticks `...`
    match = re.search(r'`([^`]+)`', content)
    if not match:
        print("CSV content not found inside rawGradesCsv.ts!")
        return
    
    csv_str = match.group(1)
    
    # Load into pandas DataFrame
    # Let's clean up any weird spaces, strip trailing commas, and read CSV
    lines = []
    for line in csv_str.strip().split('\n'):
        line = line.strip()
        if not line:
            continue
        # Split by comma, strip whitespace for each element
        parts = [p.strip() for p in line.split(',')]
        # If there is a trailing comma, parts might have an empty string at the end
        if len(parts) > 1 and parts[-1] == '':
            parts = parts[:-1]
        lines.append(parts)
        
    headers = lines[0]
    data_rows = lines[1:]
    
    df = pd.DataFrame(data_rows, columns=headers)
    
    # Print headers to verify columns
    print("Columns:", df.columns.tolist())
    
    # Convert types
    df['반'] = pd.to_numeric(df['반'])
    df['번호'] = pd.to_numeric(df['번호'])
    df['학년'] = pd.to_numeric(df['학년'])
    df['학기'] = pd.to_numeric(df['학기'])
    df['이수단위'] = pd.to_numeric(df['이수단위'])
    df['석차등급'] = pd.to_numeric(df['석차등급'])
    
    # Check for duplicate rows
    duplicate_count = df.duplicated().sum()
    print(f"Total rows: {len(df)}")
    print(f"Duplicate rows count: {duplicate_count}")
    
    # Let's see some duplicates if any
    if duplicate_count > 0:
        print("Examples of duplicate rows:")
        print(df[df.duplicated(keep=False)].head(10))
        
        # Let's de-duplicate! Does the user want to de-duplicate, or is it that we should de-duplicate?
        # "학년 학기 학년과목들이 학년 학기들에 들어가서" 
        # Wait, the user said: "특히 1학년 과목들이 다른 학년 학기들에 들어가서 산출이 같이 되고 있는 문제점이 있는데?"
        # Ah! Let's check if there are 1학년 rows where 학년 is 1, but we parse them incorrectly into other semesters or vice versa, OR if there is an overlapping issue!
        
    # Let's group by student: 학번 = 3 + 반 + 번호(2자리)
    df['학번'] = "3" + df['반'].astype(str) + df['번호'].astype(str).str.zfill(2)
    df['학기키'] = df['학년'].astype(str) + "-" + df['학기'].astype(str)
    
    # Let's calculate GPA using formula: sum(이수단위 * 석차등급) / sum(이수단위)
    # 1. Overall GPA per student
    df['weighted_rank'] = df['이수단위'] * df['석차등급']
    
    # Let's print out a few students' computed grades
    student_gpas = df.groupby('학번').apply(
        lambda g: g['weighted_rank'].sum() / g['이수단위'].sum()
    ).round(2)
    
    print("\nSample Student Overall GPAs (top 5):")
    print(student_gpas.head(5))
    
    # 2. Semester-wise GPAs
    sem_gpas = df.groupby(['학번', '학기키']).apply(
        lambda g: g['weighted_rank'].sum() / g['이수단위'].sum()
    ).round(2)
    
    print("\nSample Semester-wise GPAs for 3101 강성민:")
    if '3101' in sem_gpas.index:
        print(sem_gpas.loc['3101'])
    else:
        # try 3102
        print(sem_gpas.head(10))

if __name__ == "__main__":
    main()
