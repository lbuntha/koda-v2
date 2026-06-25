import { useCallback } from 'react';

import { getStoredToken, submitLesson } from '@/lib/api';
import type { LessonResult, SubmittedAnswer } from '../types';

interface SubmitArgs {
    clientAttemptId: string;
    childProfileId: string;
    skillId: string;
    answers: SubmittedAnswer[];
    startedAt: number;
}

export function useLessonPersistence() {
    return useCallback(async ({ clientAttemptId, childProfileId, skillId, answers, startedAt }: SubmitArgs): Promise<LessonResult> => {
        const token = getStoredToken();
        if (!token) {
            throw new Error('Not signed in');
        }
        return submitLesson(token, {
            client_attempt_id: clientAttemptId,
            child_profile_id: childProfileId,
            skill_id: skillId,
            answers,
            started_at: new Date(startedAt).toISOString(),
            completed_at: new Date().toISOString(),
        });
    }, []);
}
