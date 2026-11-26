/**
 * Group size of an experience: the fewest and most travellers one departure takes. One place, so product can change the
 * rule: the maximum is enforced (the traveller steppers stop there); the minimum is only shown ("Runs with 4+ guests"),
 * it never blocks a search. Every mock experience uses it. TODO(api): the real group size comes with each experience.
 */
export const EXPERIENCE_GROUP_SIZE = { min: 4, max: 12 } as const;
