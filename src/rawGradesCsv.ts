import { CLASS1_CSV } from "./rawGradesCsv_class1";
import { CLASS2_CSV } from "./rawGradesCsv_class2";
import { CLASS3_CSV } from "./rawGradesCsv_class3";
import { CLASS4_CSV } from "./rawGradesCsv_class4";
import { CLASS5_CSV } from "./rawGradesCsv_class5";
import { CLASS6_CSV } from "./rawGradesCsv_class6";
import { CLASS7_1_CSV } from "./rawGradesCsv_class7_1";
import { CLASS7_2_CSV } from "./rawGradesCsv_class7_2";
import { CLASS8_CSV } from "./rawGradesCsv_class8";

const HEADER = "반,번호,이름,학년,학기,교과,과목,이수단위,석차등급\n";

export const RAW_GRADES_CSV = 
  HEADER + 
  CLASS1_CSV.trim() + "\n" +
  CLASS2_CSV.trim() + "\n" +
  CLASS3_CSV.trim() + "\n" +
  CLASS4_CSV.trim() + "\n" +
  CLASS5_CSV.trim() + "\n" +
  CLASS6_CSV.trim() + "\n" +
  CLASS7_1_CSV.trim() + "\n" +
  CLASS7_2_CSV.trim() + "\n" +
  CLASS8_CSV.trim() + "\n";
