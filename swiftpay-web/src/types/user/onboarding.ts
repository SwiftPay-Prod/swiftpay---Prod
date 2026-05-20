export interface UserOnboardingData {
	completed: boolean;
	completedAt: string | null;
	discovery: string[];
	discoveryOther: string | null;
	channels: string[];
	channelsOther: string | null;
	goals: string[];
	goalsOther: string | null;
}

export interface UpdateUserOnboardingRequest {
	discovery: string[];
	discoveryOther?: string | null;
	channels: string[];
	channelsOther?: string | null;
	goals: string[];
	goalsOther?: string | null;
}

export interface UpdateUserOnboardingData {
	completed: boolean;
	completedAt: string;
}
