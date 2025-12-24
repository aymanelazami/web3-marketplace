'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

interface User {
    id: string;
    walletAddress: string;
    creditBalance: string;
    isAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { address, isConnected } = useAccount();
    const { connectAsync, connectors } = useConnect();
    const { disconnectAsync } = useDisconnect();
    const { signMessageAsync } = useSignMessage();

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Refresh user failed:', error);
        }
    }, []);

    const login = useCallback(async () => {
        try {
            setIsLoading(true);

            // Connect wallet if not connected
            let walletAddress = address;
            if (!isConnected) {
                const connector = connectors[0];
                const result = await connectAsync({ connector });
                walletAddress = result.accounts[0];
            }

            if (!walletAddress) {
                throw new Error('No wallet address available');
            }

            // Get nonce from server
            const nonceRes = await fetch('/api/auth/nonce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });

            if (!nonceRes.ok) {
                throw new Error('Failed to get nonce');
            }

            const { nonce } = await nonceRes.json();

            // Create SIWE message
            const message = new SiweMessage({
                domain: window.location.host,
                address: walletAddress,
                statement: 'Sign in to Web3 Store',
                uri: window.location.origin,
                version: '1',
                chainId: 1, // Ethereum Mainnet
                nonce,
            });

            const messageToSign = message.prepareMessage();

            // Sign message
            const signature = await signMessageAsync({ message: messageToSign });

            // Verify with server
            const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageToSign, signature }),
            });

            if (!verifyRes.ok) {
                throw new Error('Verification failed');
            }

            const { user: userData } = await verifyRes.json();
            setUser(userData);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [address, isConnected, connectors, connectAsync, signMessageAsync]);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            await disconnectAsync();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [disconnectAsync]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
