import { describe, it, expect } from 'vitest';
import {
  onboardingProfileSchema,
  COACH_PERSONAS,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  TIME_WASTER_OPTIONS,
  AVOIDANCE_BEHAVIOR_OPTIONS,
  LEVERAGE_GOAL_OPTIONS,
  type UserOnboardingProfile,
} from '../onboarding';

// /api/onboarding/complete valideert elk ingezonden profiel opnieuw tegen dit schema vóórdat het
// wordt weggeschreven (nooit de client vertrouwen — zie die route). Als de wizard
// (src/app/onboarding/page.tsx submit()) en dit schema uit de pas lopen, faalt de intake stil met
// "Kon je profiel niet opslaan" voor elke nieuwe gebruiker — de meest kritieke, tot nu toe
// ongeteste stap in de app (zie STATUS.md). Deze test bouwt exact dezelfde payload-vorm als
// submit() en toetst 'm tegen het echte schema, i.p.v. tegen een losstaande aanname.

function buildValidProfile(): UserOnboardingProfile {
  return {
    coachProfile: {
      gender: 'male',
      displayName: COACH_PERSONAS.male.defaultName,
      voiceId: COACH_PERSONAS.male.voiceId,
      toneSeverity: 'high_challenger',
    },
    businessDna: {
      industry: INDUSTRY_OPTIONS[0].value,
      teamSize: TEAM_SIZE_OPTIONS[0].value,
      businessModel: BUSINESS_MODEL_OPTIONS[0].value,
      topTimeWasters: [TIME_WASTER_OPTIONS[0].value],
      avoidanceBehavior: AVOIDANCE_BEHAVIOR_OPTIONS[0].value,
      quarterlyLeverageGoal: LEVERAGE_GOAL_OPTIONS[0].value,
    },
    consequenceModule: {
      description: 'Mijn grootste concurrent op de hoogte stellen dat ik dit kwartaal mijn doel niet haalde',
    },
    assistantPreferences: {
      morningBriefingTime: '08:00',
      eveningReviewTime: '17:30',
      deliveryChannel: 'in_app',
      coachingTone: 'direct_and_challenging',
    },
    impactProfile: {
      missionStatement: '',
      targetBeneficiaries: '',
      quarterlyLeverageGoal: LEVERAGE_GOAL_OPTIONS[0].label,
      targetDeadline: '2026-12-31',
    },
  };
}

describe('onboardingProfileSchema', () => {
  it('accepteert de exacte payload-vorm die de wizard (submit()) verstuurt', () => {
    const result = onboardingProfileSchema.safeParse(buildValidProfile());
    expect(result.success).toBe(true);
  });

  it('accepteert elke waarde uit elke chip-optie-lijst (UI en schema mogen niet uit de pas lopen)', () => {
    for (const industry of INDUSTRY_OPTIONS.map((o) => o.value)) {
      const profile = buildValidProfile();
      profile.businessDna.industry = industry;
      expect(onboardingProfileSchema.safeParse(profile).success, `industry: ${industry}`).toBe(true);
    }
    for (const teamSize of TEAM_SIZE_OPTIONS.map((o) => o.value)) {
      const profile = buildValidProfile();
      profile.businessDna.teamSize = teamSize;
      expect(onboardingProfileSchema.safeParse(profile).success, `teamSize: ${teamSize}`).toBe(true);
    }
    for (const businessModel of BUSINESS_MODEL_OPTIONS.map((o) => o.value)) {
      const profile = buildValidProfile();
      profile.businessDna.businessModel = businessModel;
      expect(onboardingProfileSchema.safeParse(profile).success, `businessModel: ${businessModel}`).toBe(true);
    }
    for (const avoidanceBehavior of AVOIDANCE_BEHAVIOR_OPTIONS.map((o) => o.value)) {
      const profile = buildValidProfile();
      profile.businessDna.avoidanceBehavior = avoidanceBehavior;
      expect(onboardingProfileSchema.safeParse(profile).success, `avoidanceBehavior: ${avoidanceBehavior}`).toBe(true);
    }
    for (const quarterlyLeverageGoal of LEVERAGE_GOAL_OPTIONS.map((o) => o.value)) {
      const profile = buildValidProfile();
      profile.businessDna.quarterlyLeverageGoal = quarterlyLeverageGoal;
      expect(onboardingProfileSchema.safeParse(profile).success, `leverageGoal: ${quarterlyLeverageGoal}`).toBe(true);
    }
  });

  it('staat tot 3 tijdvreters toe, maar niet meer (de wizard begrenst dit al in de UI)', () => {
    const profile = buildValidProfile();
    profile.businessDna.topTimeWasters = TIME_WASTER_OPTIONS.slice(0, 3).map((o) => o.value);
    expect(onboardingProfileSchema.safeParse(profile).success).toBe(true);

    profile.businessDna.topTimeWasters = TIME_WASTER_OPTIONS.slice(0, 4).map((o) => o.value);
    expect(onboardingProfileSchema.safeParse(profile).success).toBe(false);
  });

  it('weigert een profiel zonder businessDna (verplicht, geen .optional() in het schema)', () => {
    const profile = buildValidProfile() as Record<string, unknown>;
    delete profile.businessDna;
    expect(onboardingProfileSchema.safeParse(profile).success).toBe(false);
  });

  it('weigert een leeg consequentie-antwoord (min(1) in consequenceModuleSchema)', () => {
    const profile = buildValidProfile();
    profile.consequenceModule = { description: '' };
    expect(onboardingProfileSchema.safeParse(profile).success).toBe(false);
  });
});
