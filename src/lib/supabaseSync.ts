import { ChildProfile, SentenceEvaluation, DiagnosticReport } from '../types';

/**
 * Service to sync data to Supabase database.
 * Configure SUPABASE_URL and SUPABASE_ANON_KEY when ready to connect live database.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export async function saveSpeakerToDatabase(profile: ChildProfile) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.info('[Supabase] Offline Mode: Data stored locally. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to sync.');
    return { success: true, offline: true };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/speakers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        speaker_id: profile.speakerId,
        child_name: profile.name,
        age: profile.age,
        gender: profile.gender,
        parent_name: profile.parentName,
        parent_mobile: profile.parentMobile,
        consent_given: profile.consent,
        consent_form_id: `C${profile.speakerId}`,
        consent_timestamp: new Date().toISOString()
      })
    });

    if (!res.ok) throw new Error(await res.text());
    return { success: true };
  } catch (err) {
    console.error('[Supabase] Error saving speaker:', err);
    return { success: false, error: err };
  }
}

export async function saveAssessmentAndRecordings(report: DiagnosticReport) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.info('[Supabase] Offline Mode: Assessment stored locally.');
    return { success: true, offline: true };
  }

  try {
    // 1. Insert into assessments table
    const assessRes = await fetch(`${SUPABASE_URL}/rest/v1/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        speaker_id: report.profile.speakerId,
        overall_score: report.overallScore,
        overall_clarity: report.overallClarity,
        overall_fluency: report.overallFluency,
        avg_repetition_score: report.avgRepetitionScore,
        avg_prolongation_score: report.avgProlongationScore,
        primary_issue: report.coreDiagnosis.primaryIssue,
        severity: report.coreDiagnosis.severity,
        diagnostic_description: report.coreDiagnosis.description,
        flag_stuttering: report.coreDiagnosis.flags.stuttering,
        flag_prolongation: report.coreDiagnosis.flags.prolongation,
        flag_breath_sustain: report.coreDiagnosis.flags.breathSustain,
        flag_articulation: report.coreDiagnosis.flags.articulation,
        flag_pacing: report.coreDiagnosis.flags.pacing,
        recommendations_json: report.recommendations
      })
    });

    const assessData = await assessRes.json();
    const assessmentId = assessData?.[0]?.assessment_id;

    // 2. Insert each recording into recordings table
    const recordingsPayload = report.sentences.map(s => ({
      recording_id: s.audioFilename.replace('.WAV', ''),
      assessment_id: assessmentId,
      speaker_id: s.speakerId,
      prompt_id: s.promptId,
      target_sentence: s.targetSentence,
      spoken_whisper_text: s.spokenWhisperText,
      file_format: 'WAV',
      sample_rate_hz: 16000,
      bit_depth: 16,
      audio_codec: 'PCM',
      duration_sec: Number((s.durationMs / 1000).toFixed(2)),
      clarity_pct: s.clarityPct,
      fluency_pct: s.fluencyPct,
      repetition_pct: s.repetitionPct,
      prolongation_pct: s.prolongationPct,
      words_per_second: s.wps,
      detected_issues: s.detectedIssues,
      clinical_feedback: s.feedback
    }));

    await fetch(`${SUPABASE_URL}/rest/v1/recordings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(recordingsPayload)
    });

    return { success: true };
  } catch (err) {
    console.error('[Supabase] Error saving assessment & recordings:', err);
    return { success: false, error: err };
  }
}
