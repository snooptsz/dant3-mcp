import { supabase } from "@/integrations/supabase/client";
import {
  cleanText,
  isSyndicationEligible,
  type PublicExternalJob,
  type PublicJob,
} from "@/lib/public-jobs";

const db = supabase as any;
const BASE_URL = "https://dant3.net";
const MAX_FEED_JOBS = 500;

type RawJob = {
  id: string; owner_id: string; title: string; description: string; location: string | null;
  is_remote: boolean; employment_type: string; compensation_text: string | null; status: string;
  created_at: string; company_name: string | null; requirements_text: string | null;
  skills: string[] | null; applicant_types: string[] | null; experience_level: string | null;
};
type RawExternalJob = {
  id: string; source_name: string; source_url: string; source_terms_url: string; source_attribution: string;
  company_name: string; title: string; summary: string; location: string | null; is_remote: boolean;
  employment_type: string; compensation_text: string | null; applicant_types: string[] | null;
  last_verified_at: string; target_country_codes: string[]; published_at: string | null;
};
type PublicProfile = { id: string; username: string | null; display_name: string | null };

function safeUsername(value: unknown): string | null { const username = cleanText(value, 80); return /^[a-z0-9][a-z0-9._-]{1,79}$/i.test(username) ? username : null; }
function cleanList(value: unknown, limit = 20): string[] { if (!Array.isArray(value)) return []; return value.map((item) => cleanText(item, 60)).filter(Boolean).slice(0, limit); }
function mapJob(job: RawJob, owner?: PublicProfile): PublicJob { const username = safeUsername(owner?.username); const displayName = cleanText(owner?.display_name, 120); const companyName = cleanText(job.company_name, 160); return { id: cleanText(job.id, 80), ownerId: cleanText(job.owner_id, 80), title: cleanText(job.title, 180), description: cleanText(job.description), location: cleanText(job.location, 180) || null, isRemote: Boolean(job.is_remote), employmentType: cleanText(job.employment_type, 60) || "other", compensationText: cleanText(job.compensation_text, 180) || null, status: cleanText(job.status, 40), createdAt: cleanText(job.created_at, 80), employerName: companyName || displayName || username || "confidential", employerUrl: username ? `${BASE_URL}/u/${encodeURIComponent(username)}` : null, requirementsText: cleanText(job.requirements_text, 10_000) || null, skills: cleanList(job.skills), applicantTypes: cleanList(job.applicant_types, 4), experienceLevel: cleanText(job.experience_level, 40) || "any" }; }
function mapExternalJob(job: RawExternalJob): PublicExternalJob { return { id: cleanText(job.id, 80), sourceName: cleanText(job.source_name, 120), sourceUrl: cleanText(job.source_url, 1700), sourceTermsUrl: cleanText(job.source_terms_url, 1700), sourceAttribution: cleanText(job.source_attribution, 500), companyName: cleanText(job.company_name, 160), title: cleanText(job.title, 180), summary: cleanText(job.summary, 4000), location: cleanText(job.location, 180) || null, isRemote: Boolean(job.is_remote), employmentType: cleanText(job.employment_type, 60) || "other", compensationText: cleanText(job.compensation_text, 180) || null, applicantTypes: cleanList(job.applicant_types, 4), lastVerifiedAt: cleanText(job.last_verified_at, 80), targetCountryCodes: cleanList(job.target_country_codes, 6), publishedAt: cleanText(job.published_at, 80) || null }; }
async function loadOwners(ownerIds: string[]): Promise<Map<string, PublicProfile>> { if (!ownerIds.length) return new Map(); const { data, error } = await db.from("profiles_public").select("id, username, display_name").in("id", ownerIds); if (error) return new Map(); return new Map(((data ?? []) as PublicProfile[]).map((profile) => [String(profile.id), profile])); }
const JOB_SELECT = "id, owner_id, title, description, location, is_remote, employment_type, compensation_text, status, created_at, company_name, requirements_text, skills, applicant_types, experience_level";

export async function listOpenPublicJobs(limit = 100): Promise<PublicJob[]> { const safeLimit = Math.max(1, Math.min(Number(limit) || 100, MAX_FEED_JOBS)); const { data, error } = await db.from("job_posts").select(JOB_SELECT).eq("status", "open").eq("moderation_status", "approved").order("created_at", { ascending: false }).limit(safeLimit); if (error) throw new Error(`Public jobs unavailable: ${error.message}`); const jobs = (data ?? []) as RawJob[]; const owners = await loadOwners([...new Set(jobs.map((job) => String(job.owner_id)).filter(Boolean))]); return jobs.map((job) => mapJob(job, owners.get(String(job.owner_id)))).filter(isSyndicationEligible); }
export async function listExternalPublicJobs(limit = 100): Promise<PublicExternalJob[]> { const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200)); const freshnessCutoff = new Date(Date.now() - 60 * 60 * 60 * 1_000).toISOString(); const { data, error } = await db.from("external_job_listings").select("id,source_name,source_url,source_terms_url,source_attribution,company_name,title,summary,location,is_remote,employment_type,compensation_text,applicant_types,last_verified_at,target_country_codes,published_at").eq("status", "active").gte("last_verified_at", freshnessCutoff).order("last_verified_at", { ascending: false }).limit(safeLimit); if (error) throw new Error(`External jobs unavailable: ${error.message}`); return ((data ?? []) as RawExternalJob[]).map(mapExternalJob); }
export async function getOpenPublicJob(id: string): Promise<PublicJob | null> { const safeId = cleanText(id, 80); if (!/^[0-9a-z-]{8,80}$/i.test(safeId)) return null; const { data, error } = await db.from("job_posts").select(JOB_SELECT).eq("id", safeId).eq("status", "open").eq("moderation_status", "approved").maybeSingle(); if (error) throw new Error(`Public job unavailable: ${error.message}`); if (!data) return null; const job = data as RawJob; const owners = await loadOwners([String(job.owner_id)]); const publicJob = mapJob(job, owners.get(String(job.owner_id))); return isSyndicationEligible(publicJob) ? publicJob : null; }
