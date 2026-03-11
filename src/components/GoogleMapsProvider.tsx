'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { getBaseUrl } from '@/lib/axios';

interface GoogleMapsContextType {
    isLoaded: boolean;
    loadError?: Error;
}

const LIBRARIES: Libraries = ['places', 'drawing', 'geometry'];

const GoogleMapsContext = createContext<GoogleMapsContextType>({ isLoaded: false });

export const useGoogleMaps = () => useContext(GoogleMapsContext);

// Inner component that loads Google Maps once we have the API key
function GoogleMapsLoader({ apiKey, children }: { apiKey: string; children: React.ReactNode }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        libraries: LIBRARIES,
    });

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
}

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<Error | undefined>();

    useEffect(() => {
        const fetchKey = async () => {
            try {
                const baseUrl = getBaseUrl();
                const response = await fetch(`${baseUrl}/api/v1/config/public`);
                const data = await response.json();
                setApiKey(data.googleMapsApiKey || '');
            } catch (err) {
                console.error('Failed to fetch Google Maps API key:', err);
                setFetchError(err instanceof Error ? err : new Error('Failed to fetch API key'));
                setApiKey('');
            }
        };

        fetchKey();
    }, []);

    // While fetching the key, render children without maps loaded
    if (apiKey === null) {
        return (
            <GoogleMapsContext.Provider value={{ isLoaded: false }}>
                {children}
            </GoogleMapsContext.Provider>
        );
    }

    // If fetch failed or key is empty, pass error through
    if (fetchError || !apiKey) {
        return (
            <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: fetchError }}>
                {children}
            </GoogleMapsContext.Provider>
        );
    }

    return (
        <GoogleMapsLoader apiKey={apiKey}>
            {children}
        </GoogleMapsLoader>
    );
}
