'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { UserInfo } from '@/types/auth';

interface UserContextValue {
	user: UserInfo;
	updateUser: (partial: Partial<UserInfo>) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
	children,
	initialUser,
}: {
	children: ReactNode;
	initialUser: UserInfo;
}) {
	const [user, setUser] = useState<UserInfo>(initialUser);

	const updateUser = useCallback((partial: Partial<UserInfo>) => {
		setUser((prev) => ({ ...prev, ...partial }));
	}, []);

	const value = useMemo(() => ({ user, updateUser }), [user, updateUser]);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error('useUser must be used within a UserProvider');
	}
	return context;
}
