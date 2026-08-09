export class PremiumSkillLimitError extends Error {
  constructor() {
    super('PREMIUM_SKILL_LIMIT');
    this.name = 'PremiumSkillLimitError';
  }
}
