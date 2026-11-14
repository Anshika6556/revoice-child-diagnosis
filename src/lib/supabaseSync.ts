import { ChildProfile, DiagnosticReport } from '../types';
import { saveSpeakerProfile, savePromptRecord, saveDiagnosticAssessment } from './dbService';

/**
 * Re-exporting unified database service for backwards compatibility.
 */
export async function saveSpeakerToDatabase(profile: ChildProfile) {
  return saveSpeakerProfile(profile);
}

export async function saveAssessmentAndRecordings(report: DiagnosticReport) {
  // 1. Save all sentence records
  for (const s of report.sentences) {
    await savePromptRecord(report.profile.speakerId, s);
  }
  // 2. Save overall diagnostic assessment
  return saveDiagnosticAssessment(report);
}
